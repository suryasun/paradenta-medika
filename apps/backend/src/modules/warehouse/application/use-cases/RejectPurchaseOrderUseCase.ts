import { AuditContext, IAuditService } from '../../../system/domain/services/IAuditService';
import { PurchaseOrderNotFoundException, PurchaseOrderNotInStatusException } from '../../domain/exceptions/WarehouseExceptions';
import { IPurchaseOrderRepository } from '../../domain/repositories/IPurchaseOrderRepository';
import { PurchaseOrderResponseDto } from '../dtos/PurchaseOrderResponseDto';
import { toPurchaseOrderResponseDto } from '../mappers/PurchaseOrderMapper';

export interface RejectPurchaseOrderInput {
  purchaseOrderId: string;
  reason: string;
  actorUserId: string;
  ipAddress?: string;
  correlationId?: string;
}

/** docs/06-tasks/task-109.md AC: "Reason is mandatory." "Rejected PO cannot be resubmitted; a new PO must be created." (enforced by SubmitPurchaseOrderUseCase's draft-only guard). */
export class RejectPurchaseOrderUseCase {
  constructor(
    private readonly purchaseOrderRepository: IPurchaseOrderRepository,
    private readonly auditService: IAuditService,
  ) {}

  async execute(input: RejectPurchaseOrderInput): Promise<PurchaseOrderResponseDto> {
    const existing = await this.purchaseOrderRepository.findById(input.purchaseOrderId);
    if (!existing) {
      throw new PurchaseOrderNotFoundException();
    }
    if (existing.status !== 'SUBMITTED') {
      throw new PurchaseOrderNotInStatusException('submitted');
    }

    const updated = await this.purchaseOrderRepository.updateStatus(input.purchaseOrderId, 'REJECTED', {
      rejectedBy: input.actorUserId,
      rejectedAt: new Date(),
      rejectionReason: input.reason,
    });

    const auditContext: AuditContext = { userId: input.actorUserId, ipAddress: input.ipAddress, correlationId: input.correlationId };
    await this.auditService.record(
      'PurchaseOrder',
      input.purchaseOrderId,
      'UPDATE',
      { status: 'SUBMITTED' },
      { status: 'REJECTED', reason: input.reason },
      auditContext,
    );

    return toPurchaseOrderResponseDto(updated);
  }
}
