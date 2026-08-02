import { AuditContext, IAuditService } from '../../../system/domain/services/IAuditService';
import { StockTransferNotFoundException, StockTransferNotInStatusException } from '../../domain/exceptions/WarehouseExceptions';
import { IStockTransferRepository } from '../../domain/repositories/IStockTransferRepository';
import { StockTransferResponseDto } from '../dtos/StockTransferResponseDto';
import { toStockTransferResponseDto } from '../mappers/StockTransferMapper';

export interface SubmitStockTransferInput {
  transferId: string;
  actorUserId: string;
  ipAddress?: string;
  correlationId?: string;
}

/** docs/06-tasks/task-117.md AC: "Only draft transfers can be submitted." */
export class SubmitStockTransferUseCase {
  constructor(
    private readonly stockTransferRepository: IStockTransferRepository,
    private readonly auditService: IAuditService,
  ) {}

  async execute(input: SubmitStockTransferInput): Promise<StockTransferResponseDto> {
    const existing = await this.stockTransferRepository.findById(input.transferId);
    if (!existing) {
      throw new StockTransferNotFoundException();
    }
    if (existing.status !== 'DRAFT') {
      throw new StockTransferNotInStatusException('draft');
    }

    const updated = await this.stockTransferRepository.updateStatus(input.transferId, 'SUBMITTED', { submittedAt: new Date() });

    const auditContext: AuditContext = { userId: input.actorUserId, ipAddress: input.ipAddress, correlationId: input.correlationId };
    await this.auditService.record(
      'StockTransfer',
      input.transferId,
      'UPDATE',
      { status: 'DRAFT' },
      { status: 'SUBMITTED' },
      auditContext,
    );

    return toStockTransferResponseDto(updated);
  }
}
