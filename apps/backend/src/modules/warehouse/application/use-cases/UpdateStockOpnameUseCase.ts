import { AuditContext, IAuditService } from '../../../system/domain/services/IAuditService';
import { StockOpnameNotFoundException, StockOpnameNotInStatusException } from '../../domain/exceptions/WarehouseExceptions';
import { IStockOpnameRepository } from '../../domain/repositories/IStockOpnameRepository';
import { StockOpnameResponseDto } from '../dtos/StockOpnameResponseDto';
import { toStockOpnameResponseDto } from '../mappers/StockOpnameMapper';

export interface UpdateStockOpnameInput {
  opnameId: string;
  notes?: string;
  items?: string[];
  actorUserId: string;
  ipAddress?: string;
  correlationId?: string;
}

/** docs/06-tasks/task-129.md AC: "update rejected once counting has started" -- only DRAFT opnames may have their scope/notes edited. */
export class UpdateStockOpnameUseCase {
  constructor(
    private readonly stockOpnameRepository: IStockOpnameRepository,
    private readonly auditService: IAuditService,
  ) {}

  async execute(input: UpdateStockOpnameInput): Promise<StockOpnameResponseDto> {
    const existing = await this.stockOpnameRepository.findById(input.opnameId);
    if (!existing) {
      throw new StockOpnameNotFoundException();
    }
    if (existing.status !== 'DRAFT') {
      throw new StockOpnameNotInStatusException('DRAFT');
    }

    const updated = await this.stockOpnameRepository.replaceScope(input.opnameId, {
      notes: input.notes,
      itemIds: input.items,
      updatedBy: input.actorUserId,
    });

    const auditContext: AuditContext = { userId: input.actorUserId, ipAddress: input.ipAddress, correlationId: input.correlationId };
    await this.auditService.record('StockOpname', input.opnameId, 'UPDATE', existing, updated, auditContext);

    return toStockOpnameResponseDto(updated);
  }
}
