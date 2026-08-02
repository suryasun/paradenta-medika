import { AuditContext, IAuditService } from '../../../system/domain/services/IAuditService';
import {
  PurchaseOrderHasPostedReceiptsException,
  PurchaseOrderNotFoundException,
  PurchaseOrderNotInStatusException,
} from '../../domain/exceptions/WarehouseExceptions';
import { IPurchaseOrderRepository } from '../../domain/repositories/IPurchaseOrderRepository';
import { PurchaseOrderResponseDto } from '../dtos/PurchaseOrderResponseDto';
import { toPurchaseOrderResponseDto } from '../mappers/PurchaseOrderMapper';

export interface CancelPurchaseOrderInput {
  purchaseOrderId: string;
  reason?: string;
  actorUserId: string;
  ipAddress?: string;
  correlationId?: string;
}

const TERMINAL_STATUSES = ['CANCELLED', 'REJECTED', 'RECEIVED'];

/**
 * docs/06-tasks/task-110.md AC: "Cancel rejected once any Goods Receipt has
 * been posted against the PO." This is the literal task AC, taken over the
 * SAD's state diagram ("PartiallyReceived -> Cancelled: cancel remainder"),
 * per this project's document priority order (Task Spec > SAD) --
 * cancellation is blocked unconditionally once any receipt is posted,
 * rather than allowing a partial "cancel the remainder" flow the task text
 * does not describe.
 */
export class CancelPurchaseOrderUseCase {
  constructor(
    private readonly purchaseOrderRepository: IPurchaseOrderRepository,
    private readonly auditService: IAuditService,
  ) {}

  async execute(input: CancelPurchaseOrderInput): Promise<PurchaseOrderResponseDto> {
    const existing = await this.purchaseOrderRepository.findById(input.purchaseOrderId);
    if (!existing) {
      throw new PurchaseOrderNotFoundException();
    }
    if (TERMINAL_STATUSES.includes(existing.status)) {
      throw new PurchaseOrderNotInStatusException('draft, submitted, approved, or partially received');
    }

    const hasPostedReceipts = await this.purchaseOrderRepository.hasPostedGoodsReceipts(input.purchaseOrderId);
    if (hasPostedReceipts) {
      throw new PurchaseOrderHasPostedReceiptsException();
    }

    const updated = await this.purchaseOrderRepository.updateStatus(input.purchaseOrderId, 'CANCELLED', {
      cancelledBy: input.actorUserId,
      cancelledAt: new Date(),
      cancelReason: input.reason,
    });

    const auditContext: AuditContext = { userId: input.actorUserId, ipAddress: input.ipAddress, correlationId: input.correlationId };
    await this.auditService.record(
      'PurchaseOrder',
      input.purchaseOrderId,
      'UPDATE',
      { status: existing.status },
      { status: 'CANCELLED', reason: input.reason },
      auditContext,
    );

    return toPurchaseOrderResponseDto(updated);
  }
}
