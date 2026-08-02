import { AuditContext, IAuditService } from '../../../system/domain/services/IAuditService';
import { StockOpnameNotFoundException, StockOpnameNotInStatusException } from '../../domain/exceptions/WarehouseExceptions';
import { IStockOpnameRepository } from '../../domain/repositories/IStockOpnameRepository';
import { IStockRepository } from '../../domain/repositories/IStockRepository';
import { StockOpnameResponseDto } from '../dtos/StockOpnameResponseDto';
import { toStockOpnameResponseDto } from '../mappers/StockOpnameMapper';

export interface StartStockOpnameCountInput {
  opnameId: string;
  actorUserId: string;
  ipAddress?: string;
  correlationId?: string;
}

/**
 * docs/06-tasks/task-130.md AC: "System quantity snapshot is immutable
 * once counting starts." Reads `currentStock` for every scoped item at
 * this moment and freezes it onto `systemQuantity`; DRAFT -> COUNTING.
 */
export class StartStockOpnameCountUseCase {
  constructor(
    private readonly stockOpnameRepository: IStockOpnameRepository,
    private readonly stockRepository: IStockRepository,
    private readonly auditService: IAuditService,
  ) {}

  async execute(input: StartStockOpnameCountInput): Promise<StockOpnameResponseDto> {
    const existing = await this.stockOpnameRepository.findById(input.opnameId);
    if (!existing) {
      throw new StockOpnameNotFoundException();
    }
    if (existing.status !== 'DRAFT') {
      throw new StockOpnameNotInStatusException('DRAFT');
    }

    const systemQuantities = new Map<string, number>();
    for (const line of existing.items) {
      const stock = await this.stockRepository.findByWarehouseAndItem(existing.warehouseId, line.itemId);
      systemQuantities.set(line.itemId, stock ? Number(stock.currentStock) : 0);
    }

    const now = new Date();
    const started = await this.stockOpnameRepository.startCount(input.opnameId, systemQuantities, now);

    const auditContext: AuditContext = { userId: input.actorUserId, ipAddress: input.ipAddress, correlationId: input.correlationId };
    await this.auditService.record(
      'StockOpname',
      input.opnameId,
      'UPDATE',
      { status: 'DRAFT' },
      { status: 'COUNTING', snapshotAt: now.toISOString() },
      auditContext,
    );

    return toStockOpnameResponseDto(started);
  }
}
