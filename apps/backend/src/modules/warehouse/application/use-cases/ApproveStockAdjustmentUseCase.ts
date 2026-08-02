import { AuditContext, IAuditService } from '../../../system/domain/services/IAuditService';
import {
  StockAdjustmentNotFoundException,
  StockAdjustmentNotInStatusException,
  WarehouseSegregationOfDutiesException,
} from '../../domain/exceptions/WarehouseExceptions';
import { IStockAdjustmentRepository } from '../../domain/repositories/IStockAdjustmentRepository';
import { StockAdjustmentResponseDto } from '../dtos/StockAdjustmentResponseDto';
import { toStockAdjustmentResponseDto } from '../mappers/StockAdjustmentMapper';

export interface ApproveStockAdjustmentInput {
  adjustmentId: string;
  actorUserId: string;
  ipAddress?: string;
  correlationId?: string;
}

/** docs/06-tasks/task-123.md: maker-checker enforced (approver != requester); gates the `WHS_ADJUSTMENT_APPROVAL_REQUIRED` post check. */
export class ApproveStockAdjustmentUseCase {
  constructor(
    private readonly stockAdjustmentRepository: IStockAdjustmentRepository,
    private readonly auditService: IAuditService,
  ) {}

  async execute(input: ApproveStockAdjustmentInput): Promise<StockAdjustmentResponseDto> {
    const existing = await this.stockAdjustmentRepository.findById(input.adjustmentId);
    if (!existing) {
      throw new StockAdjustmentNotFoundException();
    }
    if (existing.status !== 'DRAFT') {
      throw new StockAdjustmentNotInStatusException('draft');
    }
    if (existing.createdBy && existing.createdBy === input.actorUserId) {
      throw new WarehouseSegregationOfDutiesException();
    }

    const updated = await this.stockAdjustmentRepository.updateStatus(input.adjustmentId, 'APPROVED', {
      approvedBy: input.actorUserId,
      approvedAt: new Date(),
    });

    const auditContext: AuditContext = { userId: input.actorUserId, ipAddress: input.ipAddress, correlationId: input.correlationId };
    await this.auditService.record(
      'StockAdjustment',
      input.adjustmentId,
      'UPDATE',
      { status: 'DRAFT' },
      { status: 'APPROVED', approvedBy: input.actorUserId },
      auditContext,
    );

    return toStockAdjustmentResponseDto(updated);
  }
}
