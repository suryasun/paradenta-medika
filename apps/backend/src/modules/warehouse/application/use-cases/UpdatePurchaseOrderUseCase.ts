import { AuditContext, IAuditService } from '../../../system/domain/services/IAuditService';
import { PurchaseOrderNotDraftException, PurchaseOrderNotFoundException } from '../../domain/exceptions/WarehouseExceptions';
import { IPurchaseOrderRepository } from '../../domain/repositories/IPurchaseOrderRepository';
import { PurchaseOrderItemEntryDto } from '../dtos/PurchaseOrderRequestDto';
import { PurchaseOrderResponseDto } from '../dtos/PurchaseOrderResponseDto';
import { toPurchaseOrderResponseDto } from '../mappers/PurchaseOrderMapper';

export interface UpdatePurchaseOrderInput {
  purchaseOrderId: string;
  warehouseId?: string;
  expectedDate?: string;
  items?: PurchaseOrderItemEntryDto[];
  actorUserId: string;
  ipAddress?: string;
  correlationId?: string;
}

/** docs/06-tasks/task-106.md AC: "Update rejected once PO is submitted/approved (must be draft)." */
export class UpdatePurchaseOrderUseCase {
  constructor(
    private readonly purchaseOrderRepository: IPurchaseOrderRepository,
    private readonly auditService: IAuditService,
  ) {}

  async execute(input: UpdatePurchaseOrderInput): Promise<PurchaseOrderResponseDto> {
    const existing = await this.purchaseOrderRepository.findById(input.purchaseOrderId);
    if (!existing) {
      throw new PurchaseOrderNotFoundException();
    }
    if (existing.status !== 'DRAFT') {
      throw new PurchaseOrderNotDraftException();
    }

    const updated = await this.purchaseOrderRepository.replaceItems(input.purchaseOrderId, {
      warehouseId: input.warehouseId,
      expectedDate: input.expectedDate ? new Date(input.expectedDate) : undefined,
      items: input.items?.map((item) => ({ itemId: item.itemId, quantity: item.quantity, unitPrice: item.unitPrice })),
      updatedBy: input.actorUserId,
    });

    const auditContext: AuditContext = { userId: input.actorUserId, ipAddress: input.ipAddress, correlationId: input.correlationId };
    await this.auditService.record('PurchaseOrder', input.purchaseOrderId, 'UPDATE', existing, updated, auditContext);

    return toPurchaseOrderResponseDto(updated);
  }
}
