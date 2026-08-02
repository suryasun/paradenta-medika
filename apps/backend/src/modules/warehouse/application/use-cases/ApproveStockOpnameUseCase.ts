import { AuditContext, IAuditService } from '../../../system/domain/services/IAuditService';
import {
  StockOpnameNotFoundException,
  StockOpnameNotInStatusException,
  WarehouseSegregationOfDutiesException,
} from '../../domain/exceptions/WarehouseExceptions';
import { IStockOpnameRepository } from '../../domain/repositories/IStockOpnameRepository';
import { StockOpnameResponseDto } from '../dtos/StockOpnameResponseDto';
import { toStockOpnameResponseDto } from '../mappers/StockOpnameMapper';

export interface ApproveStockOpnameInput {
  opnameId: string;
  actorUserId: string;
  ipAddress?: string;
  correlationId?: string;
}

/** docs/06-tasks/task-132.md AC: "Rejects self-approval" -- maker-checker, same pattern as PO/Adjustment/Transfer approval. */
export class ApproveStockOpnameUseCase {
  constructor(
    private readonly stockOpnameRepository: IStockOpnameRepository,
    private readonly auditService: IAuditService,
  ) {}

  async execute(input: ApproveStockOpnameInput): Promise<StockOpnameResponseDto> {
    const existing = await this.stockOpnameRepository.findById(input.opnameId);
    if (!existing) {
      throw new StockOpnameNotFoundException();
    }
    if (existing.status !== 'SUBMITTED') {
      throw new StockOpnameNotInStatusException('SUBMITTED');
    }
    if (existing.createdBy && existing.createdBy === input.actorUserId) {
      throw new WarehouseSegregationOfDutiesException();
    }

    const updated = await this.stockOpnameRepository.updateStatus(input.opnameId, 'APPROVED', {
      approvedBy: input.actorUserId,
      approvedAt: new Date(),
    });

    const auditContext: AuditContext = { userId: input.actorUserId, ipAddress: input.ipAddress, correlationId: input.correlationId };
    await this.auditService.record(
      'StockOpname',
      input.opnameId,
      'UPDATE',
      { status: 'SUBMITTED' },
      { status: 'APPROVED', approvedBy: input.actorUserId },
      auditContext,
    );

    return toStockOpnameResponseDto(updated);
  }
}
