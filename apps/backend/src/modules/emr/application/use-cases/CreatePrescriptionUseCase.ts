import { AuditContext, IAuditService } from '../../../system/domain/services/IAuditService';
import { ValidationException } from '../../../../shared/http/exceptions';
import { PrescriptionAllergyConflictException, VisitNotFoundException } from '../../domain/exceptions/EmrExceptions';
import { IVisitRepository } from '../../domain/repositories/IVisitRepository';
import { IPrescriptionRepository } from '../../domain/repositories/IPrescriptionRepository';
import { AllergyCheckService } from '../services/AllergyCheckService';
import { assertVisitOpen } from '../services/assertVisitOpen';
import { PrescriptionItemEntryDto } from '../dtos/CreatePrescriptionRequestDto';
import { PrescriptionResponseDto } from '../dtos/PrescriptionResponseDto';
import { toPrescriptionResponseDto } from '../mappers/PrescriptionMapper';

export interface CreatePrescriptionInput {
  visitId: string;
  items: PrescriptionItemEntryDto[];
  actorUserId: string;
  ipAddress?: string;
  correlationId?: string;
}

/**
 * docs/06-tasks/task-065.md + docs/03-sad/15-module-emr.md Section 24:
 * "Prescription harus divalidasi terhadap Allergy" -- a hard block per
 * explicit user sign-off (no override path). medicineName is free text,
 * not a Master Medicine FK, since no task in Phase 1/2 builds that catalog
 * (deferred to Warehouse's Medicine module, also per sign-off).
 */
export class CreatePrescriptionUseCase {
  constructor(
    private readonly visitRepository: IVisitRepository,
    private readonly prescriptionRepository: IPrescriptionRepository,
    private readonly allergyCheckService: AllergyCheckService,
    private readonly auditService: IAuditService,
  ) {}

  async execute(input: CreatePrescriptionInput): Promise<PrescriptionResponseDto> {
    const visit = await this.visitRepository.findById(input.visitId);
    if (!visit) {
      throw new VisitNotFoundException();
    }
    assertVisitOpen(visit);

    if (input.items.length === 0) {
      throw new ValidationException([{ field: 'items', message: 'At least one prescription item is required' }]);
    }

    const shapeErrors = input.items.flatMap((item, index) => {
      const errors: Array<{ field: string; message: string }> = [];
      if (!item.medicineName?.trim()) errors.push({ field: `items[${index}].medicineName`, message: 'medicineName is required' });
      if (!item.dosage?.trim()) errors.push({ field: `items[${index}].dosage`, message: 'dosage is required' });
      if (!item.frequency?.trim()) errors.push({ field: `items[${index}].frequency`, message: 'frequency is required' });
      if (!item.duration?.trim()) errors.push({ field: `items[${index}].duration`, message: 'duration is required' });
      return errors;
    });
    if (shapeErrors.length > 0) {
      throw new ValidationException(shapeErrors);
    }

    for (const item of input.items) {
      const conflict = await this.allergyCheckService.findMatchingDrugAllergy(visit.patientId, item.medicineName);
      if (conflict) {
        throw new PrescriptionAllergyConflictException(item.medicineName, conflict.allergen);
      }
    }

    const prescription = await this.prescriptionRepository.create({
      visitId: input.visitId,
      patientId: visit.patientId,
      doctorId: visit.doctorId,
      items: input.items,
      createdBy: input.actorUserId,
    });

    const auditContext: AuditContext = { userId: input.actorUserId, ipAddress: input.ipAddress, correlationId: input.correlationId };
    await this.auditService.record(
      'Prescription',
      prescription.id,
      'CREATE',
      null,
      { visitId: input.visitId, itemCount: input.items.length },
      auditContext,
    );

    return toPrescriptionResponseDto(prescription);
  }
}
