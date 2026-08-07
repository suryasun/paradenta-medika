import { AuditContext, IAuditService } from '../../../system/domain/services/IAuditService';
import { ITreatmentRepository } from '../../../master-data/domain/repositories/ITreatmentRepository';
import { MasterDataNotFoundException } from '../../../master-data/domain/exceptions/MasterDataExceptions';
import { IInvoiceRepository } from '../../../billing/domain/repositories/IInvoiceRepository';
import { IEventBus } from '../../../../shared/events/EventBus';
import { VisitNotFoundException, VisitTreatmentNotFoundException } from '../../domain/exceptions/EmrExceptions';
import { TREATMENT_UPDATED_EVENT, TreatmentUpdatedPayload } from '../../domain/events/EmrEvents';
import { IVisitRepository } from '../../domain/repositories/IVisitRepository';
import { IVisitTreatmentRepository } from '../../domain/repositories/IVisitTreatmentRepository';
import { assertVisitOpen } from '../services/assertVisitOpen';
import { assertTreatmentEditable } from '../services/assertTreatmentEditable';
import { TreatmentEntryResponseDto } from '../dtos/VisitResponseDto';

export interface UpdateTreatmentInput {
  visitId: string;
  visitTreatmentId: string;
  toothReference?: string;
  quantity?: number;
  unitPrice?: number;
  notes?: string;
  actorUserId: string;
  ipAddress?: string;
  correlationId?: string;
}

/**
 * docs/06-tasks/task-321.md: edits Quantity/Tooth Reference/Unit Price/Notes
 * on an existing Treatment entry, before its Invoice is PAID (reuses
 * assertTreatmentEditable, task-317's exact gate -- no separate rule).
 * Unlike task-053's create-time price snapshot ("catalog price changes must
 * not retroactively alter historical visits"), Unit Price here IS editable
 * -- this is an explicit, audited user correction, not an automatic
 * catalog-driven recalculation. `subtotal` is always recomputed as
 * unitPrice x quantity, whichever of the two (or neither) changed.
 */
export class UpdateTreatmentUseCase {
  constructor(
    private readonly visitRepository: IVisitRepository,
    private readonly visitTreatmentRepository: IVisitTreatmentRepository,
    private readonly treatmentRepository: ITreatmentRepository,
    private readonly invoiceRepository: IInvoiceRepository,
    private readonly auditService: IAuditService,
    private readonly eventBus: IEventBus,
  ) {}

  async execute(input: UpdateTreatmentInput): Promise<TreatmentEntryResponseDto> {
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

    const treatment = await this.treatmentRepository.findById(entry.treatmentId);
    if (!treatment) {
      throw new MasterDataNotFoundException('Treatment');
    }

    const quantity = input.quantity ?? entry.quantity;
    const unitPrice = input.unitPrice ?? Number(entry.unitPrice);
    const subtotal = unitPrice * quantity;

    const previous = { toothReference: entry.toothReference, quantity: entry.quantity, unitPrice: Number(entry.unitPrice), subtotal: Number(entry.subtotal), notes: entry.notes };

    const updated = await this.visitTreatmentRepository.update(input.visitTreatmentId, {
      toothReference: input.toothReference,
      quantity,
      unitPrice,
      subtotal,
      notes: input.notes,
      updatedBy: input.actorUserId,
    });

    const auditContext: AuditContext = { userId: input.actorUserId, ipAddress: input.ipAddress, correlationId: input.correlationId };
    await this.auditService.record('VisitTreatment', updated.id, 'UPDATE', previous, { quantity, unitPrice, subtotal }, auditContext);

    const eventPayload: TreatmentUpdatedPayload = {
      event: TREATMENT_UPDATED_EVENT,
      visitId: input.visitId,
      visitTreatmentId: updated.id,
      treatmentId: updated.treatmentId,
      treatmentName: treatment.treatmentName,
      quantity: Number(updated.quantity),
      unitPrice: Number(updated.unitPrice),
      subtotal: Number(updated.subtotal),
      occurredAt: new Date().toISOString(),
    };
    await this.eventBus.publish(TREATMENT_UPDATED_EVENT, eventPayload);

    return {
      id: updated.id,
      treatmentId: updated.treatmentId,
      toothReference: updated.toothReference,
      quantity: updated.quantity,
      unitPrice: Number(updated.unitPrice),
      subtotal: Number(updated.subtotal),
      notes: updated.notes,
      materials: [],
    };
  }
}
