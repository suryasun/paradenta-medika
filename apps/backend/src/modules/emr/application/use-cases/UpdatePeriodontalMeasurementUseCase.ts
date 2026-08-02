import { AuditContext, IAuditService } from '../../../system/domain/services/IAuditService';
import { ValidationException } from '../../../../shared/http/exceptions';
import {
  FurcationNotApplicableException,
  InvalidToothNumberException,
  PeriodontalAssessmentLockedException,
  PeriodontalAssessmentNotFoundException,
  PeriodontalMeasurementNotFoundException,
} from '../../domain/exceptions/EmrExceptions';
import { IPeriodontalAssessmentRepository } from '../../domain/repositories/IPeriodontalAssessmentRepository';
import { IPeriodontalMeasurementRepository } from '../../domain/repositories/IPeriodontalMeasurementRepository';
import { isValidFdiToothNumber } from '../../domain/services/fdiToothNumbers';
import { calculateCAL, isFurcationApplicable } from '../../domain/services/periodontalValidation';
import { PeriodontalMeasurementPointDto } from '../dtos/SaveMeasurementRequestDto';
import { PeriodontalMeasurementResponseDto } from '../dtos/PeriodontalResponseDto';
import { toPeriodontalMeasurementResponseDto } from '../mappers/PeriodontalMapper';

export interface UpdatePeriodontalMeasurementInput {
  assessmentId: string;
  measurementId: string;
  toothNumber?: number;
  measurementPoint?: PeriodontalMeasurementPointDto;
  pocketDepth?: number;
  gingivalMargin?: number;
  bleeding?: boolean;
  plaqueIndex?: number;
  mobility?: number;
  furcation?: string;
  actorUserId: string;
  ipAddress?: string;
  correlationId?: string;
}

/** docs/06-tasks/task-073.md: "must reject updates once the parent assessment is Locked." */
export class UpdatePeriodontalMeasurementUseCase {
  constructor(
    private readonly assessmentRepository: IPeriodontalAssessmentRepository,
    private readonly measurementRepository: IPeriodontalMeasurementRepository,
    private readonly auditService: IAuditService,
  ) {}

  async execute(input: UpdatePeriodontalMeasurementInput): Promise<PeriodontalMeasurementResponseDto> {
    const assessment = await this.assessmentRepository.findById(input.assessmentId);
    if (!assessment) {
      throw new PeriodontalAssessmentNotFoundException();
    }
    if (assessment.status === 'LOCKED') {
      throw new PeriodontalAssessmentLockedException();
    }

    const existing = await this.measurementRepository.findById(input.measurementId);
    if (!existing || existing.assessmentId !== input.assessmentId) {
      throw new PeriodontalMeasurementNotFoundException();
    }

    const toothNumber = input.toothNumber ?? existing.toothNumber;
    if (!isValidFdiToothNumber(toothNumber)) {
      throw new InvalidToothNumberException();
    }
    const furcation = input.furcation !== undefined ? input.furcation : (existing.furcation ?? undefined);
    if (furcation !== undefined && !isFurcationApplicable(toothNumber)) {
      throw new FurcationNotApplicableException();
    }

    const pocketDepth = input.pocketDepth ?? Number(existing.pocketDepth);
    const gingivalMargin = input.gingivalMargin ?? Number(existing.gingivalMargin);
    const cal = calculateCAL(pocketDepth, gingivalMargin);
    if (cal < 0) {
      throw new ValidationException([{ field: 'gingivalMargin', message: 'Computed CAL must not be negative' }]);
    }

    const updated = await this.measurementRepository.update(input.measurementId, {
      toothNumber: input.toothNumber,
      measurementPoint: input.measurementPoint,
      pocketDepth: input.pocketDepth,
      gingivalMargin: input.gingivalMargin,
      cal,
      bleeding: input.bleeding,
      plaqueIndex: input.plaqueIndex,
      mobility: input.mobility,
      furcation: input.furcation,
      updatedBy: input.actorUserId,
    });

    const auditContext: AuditContext = { userId: input.actorUserId, ipAddress: input.ipAddress, correlationId: input.correlationId };
    await this.auditService.record(
      'PeriodontalMeasurement',
      updated.id,
      'UPDATE',
      { pocketDepth: Number(existing.pocketDepth), gingivalMargin: Number(existing.gingivalMargin) },
      { pocketDepth, gingivalMargin },
      auditContext,
    );

    return toPeriodontalMeasurementResponseDto(updated);
  }
}
