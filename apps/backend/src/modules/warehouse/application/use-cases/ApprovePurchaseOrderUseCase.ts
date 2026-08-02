import { AuditContext, IAuditService } from '../../../system/domain/services/IAuditService';
import {
  PurchaseOrderNotFoundException,
  PurchaseOrderNotInStatusException,
  WarehouseSegregationOfDutiesException,
} from '../../domain/exceptions/WarehouseExceptions';
import { IPurchaseOrderRepository } from '../../domain/repositories/IPurchaseOrderRepository';
import { PurchaseOrderResponseDto } from '../dtos/PurchaseOrderResponseDto';
import { toPurchaseOrderResponseDto } from '../mappers/PurchaseOrderMapper';

export interface ApprovePurchaseOrderInput {
  purchaseOrderId: string;
  actorUserId: string;
  ipAddress?: string;
  correlationId?: string;
}

/**
 * docs/06-tasks/task-108.md AC: "Rejects self-approval."
 * docs/03-sad/18-module-warehouse.md Section 8.2: "Creator PO tidak dapat
 * meng-approve PO sendiri di atas threshold yang dikonfigurasi" -- no
 * configurable threshold exists anywhere in this task list, so the rule is
 * enforced unconditionally (every PO, not just above-threshold ones),
 * the safer reading absent a documented threshold mechanism.
 */
export class ApprovePurchaseOrderUseCase {
  constructor(
    private readonly purchaseOrderRepository: IPurchaseOrderRepository,
    private readonly auditService: IAuditService,
  ) {}

  async execute(input: ApprovePurchaseOrderInput): Promise<PurchaseOrderResponseDto> {
    const existing = await this.purchaseOrderRepository.findById(input.purchaseOrderId);
    if (!existing) {
      throw new PurchaseOrderNotFoundException();
    }
    if (existing.status !== 'SUBMITTED') {
      throw new PurchaseOrderNotInStatusException('submitted');
    }
    if (existing.createdBy && existing.createdBy === input.actorUserId) {
      throw new WarehouseSegregationOfDutiesException();
    }

    const updated = await this.purchaseOrderRepository.updateStatus(input.purchaseOrderId, 'APPROVED', {
      approvedBy: input.actorUserId,
      approvedAt: new Date(),
    });

    const auditContext: AuditContext = { userId: input.actorUserId, ipAddress: input.ipAddress, correlationId: input.correlationId };
    await this.auditService.record(
      'PurchaseOrder',
      input.purchaseOrderId,
      'UPDATE',
      { status: 'SUBMITTED' },
      { status: 'APPROVED', approvedBy: input.actorUserId },
      auditContext,
    );

    return toPurchaseOrderResponseDto(updated);
  }
}
