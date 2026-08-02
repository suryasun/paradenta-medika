import { AuditContext, IAuditService } from '../../../system/domain/services/IAuditService';
import { StockOpnameAlreadyActiveException } from '../../domain/exceptions/WarehouseExceptions';
import { IStockOpnameRepository } from '../../domain/repositories/IStockOpnameRepository';
import { StockOpnameNumberGenerator } from '../services/StockOpnameNumberGenerator';
import { StockOpnameResponseDto } from '../dtos/StockOpnameResponseDto';
import { toStockOpnameResponseDto } from '../mappers/StockOpnameMapper';

export interface CreateStockOpnameInput {
  warehouseId: string;
  opnameDate: string;
  notes?: string;
  items: string[];
  actorUserId: string;
  ipAddress?: string;
  correlationId?: string;
}

/**
 * docs/06-tasks/task-127.md/task-128.md; docs/03-sad/18-module-warehouse.md
 * UC-WHS-006 step 1. Opens a draft opname scoped to the caller-supplied
 * itemIds; enforces `WHS_OPNAME_ALREADY_ACTIVE` (Section 6.5) when the
 * target warehouse/date already has a non-terminal (not POSTED/REJECTED)
 * opname -- Section 5.7's "unique active opname scope" checked at the
 * application layer since "active" excluding two specific terminal
 * statuses has no native partial-unique-index equivalent in MySQL.
 */
export class CreateStockOpnameUseCase {
  constructor(
    private readonly stockOpnameRepository: IStockOpnameRepository,
    private readonly numberGenerator: StockOpnameNumberGenerator,
    private readonly auditService: IAuditService,
  ) {}

  async execute(input: CreateStockOpnameInput): Promise<StockOpnameResponseDto> {
    const opnameDate = new Date(input.opnameDate);

    const active = await this.stockOpnameRepository.findActive(input.warehouseId, opnameDate);
    if (active) {
      throw new StockOpnameAlreadyActiveException();
    }

    const opnameNumber = await this.numberGenerator.generate(opnameDate);
    const opname = await this.stockOpnameRepository.create({
      opnameNumber,
      warehouseId: input.warehouseId,
      opnameDate,
      notes: input.notes,
      itemIds: input.items,
      createdBy: input.actorUserId,
    });

    const auditContext: AuditContext = { userId: input.actorUserId, ipAddress: input.ipAddress, correlationId: input.correlationId };
    await this.auditService.record(
      'StockOpname',
      opname.id,
      'CREATE',
      null,
      { opnameNumber, warehouseId: input.warehouseId, opnameDate: input.opnameDate, itemCount: input.items.length },
      auditContext,
    );

    return toStockOpnameResponseDto(opname);
  }
}
