import { AuditContext, IAuditService } from '../../../system/domain/services/IAuditService';
import {
  StockTransferNotFoundException,
  StockTransferNotInStatusException,
  WarehouseSegregationOfDutiesException,
} from '../../domain/exceptions/WarehouseExceptions';
import { IStockTransferRepository } from '../../domain/repositories/IStockTransferRepository';
import { StockTransferResponseDto } from '../dtos/StockTransferResponseDto';
import { toStockTransferResponseDto } from '../mappers/StockTransferMapper';

export interface ApproveStockTransferInput {
  transferId: string;
  actorUserId: string;
  ipAddress?: string;
  correlationId?: string;
}

/** docs/06-tasks/task-118.md AC: "Rejects self-approval." */
export class ApproveStockTransferUseCase {
  constructor(
    private readonly stockTransferRepository: IStockTransferRepository,
    private readonly auditService: IAuditService,
  ) {}

  async execute(input: ApproveStockTransferInput): Promise<StockTransferResponseDto> {
    const existing = await this.stockTransferRepository.findById(input.transferId);
    if (!existing) {
      throw new StockTransferNotFoundException();
    }
    if (existing.status !== 'SUBMITTED') {
      throw new StockTransferNotInStatusException('submitted');
    }
    if (existing.createdBy && existing.createdBy === input.actorUserId) {
      throw new WarehouseSegregationOfDutiesException();
    }

    const updated = await this.stockTransferRepository.updateStatus(input.transferId, 'APPROVED', {
      approvedBy: input.actorUserId,
      approvedAt: new Date(),
    });

    const auditContext: AuditContext = { userId: input.actorUserId, ipAddress: input.ipAddress, correlationId: input.correlationId };
    await this.auditService.record(
      'StockTransfer',
      input.transferId,
      'UPDATE',
      { status: 'SUBMITTED' },
      { status: 'APPROVED', approvedBy: input.actorUserId },
      auditContext,
    );

    return toStockTransferResponseDto(updated);
  }
}
