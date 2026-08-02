import { AuditContext, IAuditService } from '../../../system/domain/services/IAuditService';
import { ValidationException } from '../../../../shared/http/exceptions';
import {
  FurcationNotApplicableException,
  InvalidToothNumberException,
  PeriodontalAssessmentLockedException,
  PeriodontalAssessmentNotFoundException,
} from '../../domain/exceptions/EmrExceptions';
import { IPeriodontalAssessmentRepository } from '../../domain/repositories/IPeriodontalAssessmentRepository';
import { IPeriodontalMeasurementRepository } from '../../domain/repositories/IPeriodontalMeasurementRepository';
import { isValidFdiToothNumber } from '../../domain/services/fdiToothNumbers';
import { calculateCAL, isFurcationApplicable } from '../../domain/services/periodontalValidation';
import { PeriodontalMeasurementPointDto } from '../dtos/SaveMeasurementRequestDto';
import { PeriodontalMeasurementResponseDto } from '../dtos/PeriodontalResponseDto';
import { toPeriodontalMeasurementResponseDto } from '../mappers/PeriodontalMapper';

export interface AddPeriodontalMeasurementInput {
  assessmentId: string;
  toothNumber: number;
  measurementPoint: PeriodontalMeasurementPointDto;
  pocketDepth: number;
  gingivalMargin: number;
  bleeding: boolean;
  plaqueIndex?: number;
  mobility?: number;
  furcation?: string;
  actorUserId: string;
  ipAddress?: string;
  correlationId?: string;
}

/**
 * docs/06-tasks/task-072.md + docs/03-sad/15-module-emr.md Part 3.2B
 * Section 14: CAL is auto-computed (pocketDepth + gingivalMargin) rather
 * than accepted from the client. Section 21: CAL must not be negative.
 */
export class AddPeriodontalMeasurementUseCase {
  constructor(
    private readonly assessmentRepository: IPeriodontalAssessmentRepository,
    private readonly measurementRepository: IPeriodontalMeasurementRepository,
    private readonly auditService: IAuditService,
  ) {}

  async execute(input: AddPeriodontalMeasurementInput): Promise<PeriodontalMeasurementResponseDto> {
    const assessment = await this.assessmentRepository.findById(input.assessmentId);
    if (!assessment) {
      throw new PeriodontalAssessmentNotFoundException();
    }
    if (assessment.status === 'LOCKED') {
      throw new PeriodontalAssessmentLockedException();
    }

    if (!isValidFdiToothNumber(input.toothNumber)) {
      throw new InvalidToothNumberException();
    }
    if (input.furcation !== undefined && !isFurcationApplicable(input.toothNumber)) {
      throw new FurcationNotApplicableException();
    }

    const cal = calculateCAL(input.pocketDepth, input.gingivalMargin);
    if (cal < 0) {
      throw new ValidationException([{ field: 'gingivalMargin', message: 'Computed CAL must not be negative' }]);
    }

    const measurement = await this.measurementRepository.create({
      assessmentId: input.assessmentId,
      toothNumber: input.toothNumber,
      measurementPoint: input.measurementPoint,
      pocketDepth: input.pocketDepth,
      gingivalMargin: input.gingivalMargin,
      cal,
      bleeding: input.bleeding,
      plaqueIndex: input.plaqueIndex,
      mobility: input.mobility,
      furcation: input.furcation,
      createdBy: input.actorUserId,
    });

    const auditContext: AuditContext = { userId: input.actorUserId, ipAddress: input.ipAddress, correlationId: input.correlationId };
    await this.auditService.record(
      'PeriodontalMeasurement',
      measurement.id,
      'CREATE',
      null,
      { assessmentId: input.assessmentId, toothNumber: input.toothNumber, measurementPoint: input.measurementPoint },
      auditContext,
    );

    return toPeriodontalMeasurementResponseDto(measurement);
  }
}
