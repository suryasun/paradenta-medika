import { AuditContext, IAuditService } from '../../../system/domain/services/IAuditService';
import { BatchNotActiveException, BatchNotFoundException } from '../../domain/exceptions/WarehouseExceptions';
import { IBatchRepository } from '../../domain/repositories/IBatchRepository';
import { IStockRepository } from '../../domain/repositories/IStockRepository';
import { StockTransactionNumberGenerator } from '../services/StockTransactionNumberGenerator';
import { BatchResponseDto } from '../dtos/BatchResponseDto';
import { toBatchResponseDto } from '../mappers/BatchMapper';

export interface QuarantineBatchInput {
  batchId: string;
  actorUserId: string;
  ipAddress?: string;
  correlationId?: string;
}

/**
 * docs/06-tasks/task-135.md: sets the batch to `quarantined` and moves its
 * `remainingQuantity` out of `availableStock` on the related Stock row
 * without touching `currentStock` -- mechanically identical to what
 * `IStockRepository.applyReservation` already does (hold quantity via
 * `reservedStock`, per UC-WHS-007), so it is reused here rather than
 * building a parallel mutation primitive. `referenceType: 'BATCH_QUARANTINE'`
 * disambiguates this hold from a genuine demand reservation in the ledger,
 * even though the fixed `WarehouseStockTransactionType` enum (SAD Section
 * 5.5's literal list) has no dedicated QUARANTINE value and the resulting
 * transaction is recorded as `RESERVATION` -- the closest existing type
 * matching "reduces available without reducing current stock."
 * Requires the batch to currently be `active` (guards against double-
 * quarantining a batch, which would double-hold its quantity).
 */
export class QuarantineBatchUseCase {
  constructor(
    private readonly batchRepository: IBatchRepository,
    private readonly stockRepository: IStockRepository,
    private readonly numberGenerator: StockTransactionNumberGenerator,
    private readonly auditService: IAuditService,
  ) {}

  async execute(input: QuarantineBatchInput): Promise<BatchResponseDto> {
    const batch = await this.batchRepository.findById(input.batchId);
    if (!batch) {
      throw new BatchNotFoundException();
    }
    if (batch.status !== 'ACTIVE') {
      throw new BatchNotActiveException();
    }

    const now = new Date();
    const transactionNumber = await this.numberGenerator.generate(now);
    await this.stockRepository.applyReservation({
      transactionNumber,
      warehouseId: batch.warehouseId,
      itemId: batch.itemId,
      quantity: Number(batch.remainingQuantity),
      release: false,
      referenceType: 'BATCH_QUARANTINE',
      referenceId: batch.id,
      transactionDate: now,
      performedBy: input.actorUserId,
    });

    const quarantined = await this.batchRepository.markQuarantined(batch.id, input.actorUserId, now);

    const auditContext: AuditContext = { userId: input.actorUserId, ipAddress: input.ipAddress, correlationId: input.correlationId };
    await this.auditService.record(
      'ItemBatch',
      batch.id,
      'UPDATE',
      { status: 'ACTIVE' },
      { status: 'QUARANTINED', quarantinedBy: input.actorUserId },
      auditContext,
    );

    return toBatchResponseDto(quarantined);
  }
}
