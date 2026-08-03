import { IEventBus } from '../../../../shared/events/EventBus';
import { AuditContext, IAuditService } from '../../../system/domain/services/IAuditService';
import { IWarehouseLocationRepository } from '../../../warehouse/domain/repositories/IWarehouseLocationRepository';
import { MinimumDocumentationException, VisitAlreadyCompletedException, VisitNotFoundException } from '../../domain/exceptions/EmrExceptions';
import {
  EMR_FINISHED_EVENT,
  EmrFinishedPayload,
  TREATMENT_MATERIAL_FINALIZED_EVENT,
  TreatmentMaterialFinalizedPayload,
} from '../../domain/events/EmrEvents';
import { ISoapNoteRepository } from '../../domain/repositories/ISoapNoteRepository';
import { IVisitRepository } from '../../domain/repositories/IVisitRepository';
import { IVisitTreatmentRepository } from '../../domain/repositories/IVisitTreatmentRepository';
import { VisitResponseDto } from '../dtos/VisitResponseDto';
import { toVisitResponse } from '../mappers/VisitMapper';

export interface CloseVisitInput {
  visitId: string;
  actorUserId: string;
  ipAddress?: string;
  correlationId?: string;
}

/**
 * docs/06-tasks/task-052.md: minimum documentation is a SOAP note and at
 * least one Treatment entry (docs/03-sad/15-module-emr.md Section 16:
 * "SOAP wajib diisi sebelum Visit ditutup"; this task's own text names
 * Treatment as the other minimum requirement). Publishes EMRFinished,
 * which task-054 (Generate Invoice, Epic H) subscribes to.
 *
 * Also publishes `emr.treatment-material-finalized.v1` per completed
 * VisitTreatment that recorded materials (task-136, Epic Z), once the
 * warehouse location for the visit's branch can be resolved. Per
 * docs/03-sad/18-module-warehouse.md UC-WHS-003 ("Kegagalan kekurangan
 * stok tidak boleh mengubah EMR secara langsung"), a missing warehouse
 * location or a downstream consumption failure must never block or
 * mutate the Visit-closing outcome -- consistent with EMRFinished's own
 * existing pattern of not wrapping this in try/catch here, and instead
 * relying on each subscriber (Warehouse's own subscription in
 * warehouse.routes.ts) to guard itself.
 */
export class CloseVisitUseCase {
  constructor(
    private readonly visitRepository: IVisitRepository,
    private readonly soapNoteRepository: ISoapNoteRepository,
    private readonly visitTreatmentRepository: IVisitTreatmentRepository,
    private readonly warehouseLocationRepository: IWarehouseLocationRepository,
    private readonly auditService: IAuditService,
    private readonly eventBus: IEventBus,
  ) {}

  async execute(input: CloseVisitInput): Promise<VisitResponseDto> {
    const visit = await this.visitRepository.findById(input.visitId);
    if (!visit) {
      throw new VisitNotFoundException();
    }
    if (visit.status === 'COMPLETED' || visit.status === 'LOCKED' || visit.status === 'ARCHIVED') {
      throw new VisitAlreadyCompletedException();
    }

    const reasons: string[] = [];
    const soapNote = await this.soapNoteRepository.findByVisitId(input.visitId);
    if (!soapNote || !soapNote.subjective || !soapNote.objective || !soapNote.assessment || !soapNote.plan) {
      reasons.push('a complete SOAP note (Subjective/Objective/Assessment/Plan) is required');
    }
    const treatmentCount = await this.visitTreatmentRepository.countByVisitId(input.visitId);
    if (treatmentCount === 0) {
      reasons.push('at least one Treatment entry is required');
    }
    if (reasons.length > 0) {
      throw new MinimumDocumentationException(reasons);
    }

    const completed = await this.visitRepository.markCompleted(input.visitId, input.actorUserId);

    const auditContext: AuditContext = { userId: input.actorUserId, ipAddress: input.ipAddress, correlationId: input.correlationId };
    await this.auditService.record('Visit', completed.id, 'UPDATE', { status: visit.status }, { status: 'COMPLETED' }, auditContext);

    const eventPayload: EmrFinishedPayload = {
      event: EMR_FINISHED_EVENT,
      visitId: completed.id,
      visitNo: completed.visitNo,
      patientId: completed.patientId,
      doctorId: completed.doctorId,
      branchId: completed.branchId,
      occurredAt: new Date().toISOString(),
    };
    await this.eventBus.publish(EMR_FINISHED_EVENT, eventPayload);

    const treatmentEntries = await this.visitTreatmentRepository.findByVisitIdWithMaterials(input.visitId);
    const entriesWithMaterials = treatmentEntries.filter((entry) => entry.materials.length > 0);
    if (entriesWithMaterials.length > 0) {
      const warehouseLocation = await this.warehouseLocationRepository.findMainByBranchId(completed.branchId);
      if (warehouseLocation) {
        const occurredAt = new Date().toISOString();
        for (const entry of entriesWithMaterials) {
          const materialPayload: TreatmentMaterialFinalizedPayload = {
            event: TREATMENT_MATERIAL_FINALIZED_EVENT,
            visitId: completed.id,
            treatmentId: entry.treatmentId,
            visitTreatmentId: entry.id,
            branchId: completed.branchId,
            warehouseId: warehouseLocation.id,
            materials: entry.materials.map((m) => ({ itemId: m.itemId, quantity: Number(m.quantity) })),
            occurredAt,
          };
          await this.eventBus.publish(TREATMENT_MATERIAL_FINALIZED_EVENT, materialPayload);
        }
      }
    }

    return toVisitResponse(completed);
  }
}
