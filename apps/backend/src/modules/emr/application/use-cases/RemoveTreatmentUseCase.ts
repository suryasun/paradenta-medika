import { AuditContext, IAuditService } from '../../../system/domain/services/IAuditService';
import { IInvoiceRepository } from '../../../billing/domain/repositories/IInvoiceRepository';
import { IEventBus } from '../../../../shared/events/EventBus';
import { VisitNotFoundException, VisitTreatmentNotFoundException } from '../../domain/exceptions/EmrExceptions';
import { TREATMENT_REMOVED_EVENT, TreatmentRemovedPayload } from '../../domain/events/EmrEvents';
import { IVisitRepository } from '../../domain/repositories/IVisitRepository';
import { IVisitTreatmentRepository } from '../../domain/repositories/IVisitTreatmentRepository';
import { assertVisitOpen } from '../services/assertVisitOpen';
import { assertTreatmentEditable } from '../services/assertTreatmentEditable';

export interface RemoveTreatmentInput {
  visitId: string;
  visitTreatmentId: string;
  actorUserId: string;
  ipAddress?: string;
  correlationId?: string;
}

/**
 * docs/06-tasks/task-321.md: removes a Treatment entry recorded by mistake,
 * before its Invoice is PAID (reuses assertTreatmentEditable, task-317's
 * exact gate). Soft delete only, per the EMR-wide "operasi DELETE
 * disarankan sebagai Soft Delete" policy -- never a physical DELETE.
 */
export class RemoveTreatmentUseCase {
  constructor(
    private readonly visitRepository: IVisitRepository,
    private readonly visitTreatmentRepository: IVisitTreatmentRepository,
    private readonly invoiceRepository: IInvoiceRepository,
    private readonly auditService: IAuditService,
    private readonly eventBus: IEventBus,
  ) {}

  async execute(input: RemoveTreatmentInput): Promise<void> {
    const visit = await this.visitRepository.findById(input.visitId);
    if (!visit) {
      throw new VisitNotFoundException();
    }
    assertVisitOpen(visit);
    await assertTreatmentEditable(input.visitId, this.invoiceRepository);

    const entry = await this.visitTreatmentRepository.findById(input.visitTreatmentId);
    if (!entry || entry.visitId !== input.visitId) {
      throw new VisitTreatmentNotFoundException();
    }

    await this.visitTreatmentRepository.softDelete(input.visitTreatmentId, input.actorUserId);

    const auditContext: AuditContext = { userId: input.actorUserId, ipAddress: input.ipAddress, correlationId: input.correlationId };
    await this.auditService.record(
      'VisitTreatment',
      entry.id,
      'DELETE',
      { treatmentId: entry.treatmentId, quantity: entry.quantity, subtotal: Number(entry.subtotal) },
      null,
      auditContext,
    );

    const eventPayload: TreatmentRemovedPayload = {
      event: TREATMENT_REMOVED_EVENT,
      visitId: input.visitId,
      visitTreatmentId: entry.id,
      occurredAt: new Date().toISOString(),
    };
    await this.eventBus.publish(TREATMENT_REMOVED_EVENT, eventPayload);
  }
}
