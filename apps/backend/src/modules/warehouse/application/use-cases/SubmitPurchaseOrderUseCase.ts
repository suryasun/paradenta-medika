import { AuditContext, IAuditService } from '../../../system/domain/services/IAuditService';
import { PurchaseOrderNotFoundException, PurchaseOrderNotInStatusException } from '../../domain/exceptions/WarehouseExceptions';
import { IPurchaseOrderRepository } from '../../domain/repositories/IPurchaseOrderRepository';
import { PurchaseOrderResponseDto } from '../dtos/PurchaseOrderResponseDto';
import { toPurchaseOrderResponseDto } from '../mappers/PurchaseOrderMapper';

export interface SubmitPurchaseOrderInput {
  purchaseOrderId: string;
  actorUserId: string;
  ipAddress?: string;
  correlationId?: string;
}

/** docs/06-tasks/task-107.md AC: "Only draft POs can be submitted." */
export class SubmitPurchaseOrderUseCase {
  constructor(
    private readonly purchaseOrderRepository: IPurchaseOrderRepository,
    private readonly auditService: IAuditService,
  ) {}

  async execute(input: SubmitPurchaseOrderInput): Promise<PurchaseOrderResponseDto> {
    const existing = await this.purchaseOrderRepository.findById(input.purchaseOrderId);
    if (!existing) {
      throw new PurchaseOrderNotFoundException();
    }
    if (existing.status !== 'DRAFT') {
      throw new PurchaseOrderNotInStatusException('draft');
    }

    const updated = await this.purchaseOrderRepository.updateStatus(input.purchaseOrderId, 'SUBMITTED', { submittedAt: new Date() });

    const auditContext: AuditContext = { userId: input.actorUserId, ipAddress: input.ipAddress, correlationId: input.correlationId };
    await this.auditService.record(
      'PurchaseOrder',
      input.purchaseOrderId,
      'UPDATE',
      { status: 'DRAFT' },
      { status: 'SUBMITTED' },
      auditContext,
    );

    return toPurchaseOrderResponseDto(updated);
  }
}
