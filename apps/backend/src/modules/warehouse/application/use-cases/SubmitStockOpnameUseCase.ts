import { AuditContext, IAuditService } from '../../../system/domain/services/IAuditService';
import {
  StockOpnameItemNotInScopeException,
  StockOpnameNotFoundException,
  StockOpnameNotInStatusException,
} from '../../domain/exceptions/WarehouseExceptions';
import { IStockOpnameRepository } from '../../domain/repositories/IStockOpnameRepository';
import { SubmitStockOpnameItemEntryDto } from '../dtos/StockOpnameRequestDto';
import { StockOpnameResponseDto } from '../dtos/StockOpnameResponseDto';
import { toStockOpnameResponseDto } from '../mappers/StockOpnameMapper';

export interface SubmitStockOpnameInput {
  opnameId: string;
  items: SubmitStockOpnameItemEntryDto[];
  actorUserId: string;
  ipAddress?: string;
  correlationId?: string;
}

/**
 * docs/06-tasks/task-131.md: "Submit counted quantities for approval,
 * computing variance per line." Requires `counting` status; every
 * submitted itemId must already be part of the opname's scope (set at
 * Create/Update time) -- there is no separate per-line "record count"
 * endpoint in task-127-135's API table, so physical counts arrive here.
 */
export class SubmitStockOpnameUseCase {
  constructor(
    private readonly stockOpnameRepository: IStockOpnameRepository,
    private readonly auditService: IAuditService,
  ) {}

  async execute(input: SubmitStockOpnameInput): Promise<StockOpnameResponseDto> {
    const existing = await this.stockOpnameRepository.findById(input.opnameId);
    if (!existing) {
      throw new StockOpnameNotFoundException();
    }
    if (existing.status !== 'COUNTING') {
      throw new StockOpnameNotInStatusException('COUNTING');
    }

    const scopeItemIds = new Set(existing.items.map((line) => line.itemId));
    for (const line of input.items) {
      if (!scopeItemIds.has(line.itemId)) {
        throw new StockOpnameItemNotInScopeException();
      }
    }

    const now = new Date();
    const submitted = await this.stockOpnameRepository.submit(
      input.opnameId,
      input.items.map((line) => ({ itemId: line.itemId, physicalQuantity: line.physicalQuantity, notes: line.notes })),
      now,
    );

    const auditContext: AuditContext = { userId: input.actorUserId, ipAddress: input.ipAddress, correlationId: input.correlationId };
    await this.auditService.record(
      'StockOpname',
      input.opnameId,
      'UPDATE',
      { status: 'COUNTING' },
      { status: 'SUBMITTED', lineCount: input.items.length },
      auditContext,
    );

    return toStockOpnameResponseDto(submitted);
  }
}
