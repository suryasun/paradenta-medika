import { AuditContext, IAuditService } from '../../../system/domain/services/IAuditService';
import { SourceDestinationSameException } from '../../domain/exceptions/WarehouseExceptions';
import { IStockTransferRepository } from '../../domain/repositories/IStockTransferRepository';
import { StockTransferNumberGenerator } from '../services/StockTransferNumberGenerator';
import { StockTransferItemEntryDto } from '../dtos/StockTransferRequestDto';
import { StockTransferResponseDto } from '../dtos/StockTransferResponseDto';
import { toStockTransferResponseDto } from '../mappers/StockTransferMapper';

export interface CreateStockTransferInput {
  sourceWarehouseId: string;
  destinationWarehouseId: string;
  notes?: string;
  items: StockTransferItemEntryDto[];
  actorUserId: string;
  ipAddress?: string;
  correlationId?: string;
}

/** docs/06-tasks/task-116.md; docs/03-sad/18-module-warehouse.md UC-WHS-004: "Tidak ada transfer ke gudang yang sama." */
export class CreateStockTransferUseCase {
  constructor(
    private readonly stockTransferRepository: IStockTransferRepository,
    private readonly numberGenerator: StockTransferNumberGenerator,
    private readonly auditService: IAuditService,
  ) {}

  async execute(input: CreateStockTransferInput): Promise<StockTransferResponseDto> {
    if (input.sourceWarehouseId === input.destinationWarehouseId) {
      throw new SourceDestinationSameException();
    }

    const now = new Date();
    const transferNumber = await this.numberGenerator.generate(now);

    const transfer = await this.stockTransferRepository.create({
      transferNumber,
      sourceWarehouseId: input.sourceWarehouseId,
      destinationWarehouseId: input.destinationWarehouseId,
      notes: input.notes,
      items: input.items.map((item) => ({ itemId: item.itemId, quantity: item.quantity })),
      createdBy: input.actorUserId,
    });

    const auditContext: AuditContext = { userId: input.actorUserId, ipAddress: input.ipAddress, correlationId: input.correlationId };
    await this.auditService.record(
      'StockTransfer',
      transfer.id,
      'CREATE',
      null,
      { transferNumber, sourceWarehouseId: input.sourceWarehouseId, destinationWarehouseId: input.destinationWarehouseId },
      auditContext,
    );

    return toStockTransferResponseDto(transfer);
  }
}
