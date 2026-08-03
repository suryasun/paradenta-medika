import { IEventBus } from '../../../../shared/events/EventBus';
import { AuditContext, IAuditService } from '../../../system/domain/services/IAuditService';
import {
  BatchExpiredException,
  ItemNotConsumableException,
  ItemNotFoundException,
  MaterialConsumptionAlreadyProcessedException,
  StockInsufficientException,
} from '../../domain/exceptions/WarehouseExceptions';
import { IBatchRepository } from '../../domain/repositories/IBatchRepository';
import { IItemRepository } from '../../domain/repositories/IItemRepository';
import { IStockRepository } from '../../domain/repositories/IStockRepository';
import { StockTransactionNumberGenerator } from '../services/StockTransactionNumberGenerator';

const REFERENCE_TYPE = 'EMR_TREATMENT_MATERIAL';

export interface ConsumeMaterialInput {
  visitId: string;
  treatmentId: string;
  visitTreatmentId: string;
  warehouseId: string;
  materials: Array<{ itemId: string; quantity: number }>;
  occurredAt: string;
  actorUserId: string;
}

export interface MaterialConsumedEventPayload {
  visitId: string;
  treatmentId: string;
  visitTreatmentId: string;
  warehouseId: string;
  materials: Array<{ itemId: string; quantity: number }>;
}

/**
 * docs/06-tasks/task-136.md; docs/03-sad/18-module-warehouse.md UC-WHS-003
 * step 1-4: consumes EMR's `emr.treatment-material-finalized.v1` event.
 * Validates each item is consumable, FEFO-allocates across active
 * (non-expired) batches for batch-tracked items, posts one `TREATMENT`
 * `StockTransaction` per allocation via the shared `applyStockMovement`
 * primitive, and emits `warehouse.material-consumed.v1` on success.
 *
 * Idempotency (task-136 AC, "WHS_DUPLICATE_MOVEMENT, idempotent
 * redelivery"): keyed on `visitTreatmentId` as a whole via
 * `referenceType=EMR_TREATMENT_MATERIAL, referenceId=visitTreatmentId` --
 * an application-layer check rather than relying solely on the DB
 * `idempotency_key` unique index, since that index treats a null
 * `batchId` (non-batch-tracked items) as distinct per MySQL NULL
 * semantics (see IStockRepository's own doc-comment on that index).
 *
 * FEFO/expiry (UC-WHS-003 step 2): for a batch-tracked item, only `ACTIVE`
 * batches with `expiryDate` null or >= this event's `occurredAt` are
 * eligible, allocated in ascending expiry order (no-expiry batches last,
 * since they never need to be prioritized over stock that is expiring).
 * If eligible batches can't cover the requested quantity but expired
 * `ACTIVE` batches exist with remaining stock, `WHS_BATCH_EXPIRED` is
 * raised instead of the generic `WHS_STOCK_INSUFFICIENT` -- distinguishing
 * "stock exists but has expired" from "no stock exists at all."
 *
 * Runs as a trusted system worker (task-136's own text: "no end-user
 * permission gate") -- there is no controller/route for this use case; it
 * is wired directly to the event bus in warehouse.routes.ts, whose
 * subscription wrapper catches any exception thrown here (this use case
 * throws rather than swallowing failures, so it stays unit-testable) and
 * publishes `warehouse.material-consumption-failed.v1` instead of letting
 * the failure propagate back into EMR's CloseVisitUseCase, per UC-WHS-003's
 * "Kegagalan kekurangan stok tidak boleh mengubah EMR secara langsung."
 */
export class ConsumeMaterialUseCase {
  constructor(
    private readonly stockRepository: IStockRepository,
    private readonly itemRepository: IItemRepository,
    private readonly batchRepository: IBatchRepository,
    private readonly numberGenerator: StockTransactionNumberGenerator,
    private readonly auditService: IAuditService,
    private readonly eventBus: IEventBus,
  ) {}

  async execute(input: ConsumeMaterialInput): Promise<void> {
    const alreadyProcessed = await this.stockRepository.findByReference(REFERENCE_TYPE, input.visitTreatmentId);
    if (alreadyProcessed.length > 0) {
      throw new MaterialConsumptionAlreadyProcessedException();
    }

    const transactionDate = new Date(input.occurredAt);

    for (const material of input.materials) {
      const item = await this.itemRepository.findById(material.itemId);
      if (!item) {
        throw new ItemNotFoundException();
      }
      if (!item.isConsumable) {
        throw new ItemNotConsumableException();
      }

      if (item.isBatchTracked) {
        await this.consumeFromBatches(item.id, input.warehouseId, material.quantity, transactionDate, input, REFERENCE_TYPE);
      } else {
        const transactionNumber = await this.numberGenerator.generate(transactionDate);
        const stock = await this.stockRepository.findByWarehouseAndItem(input.warehouseId, item.id);
        if (!stock || Number(stock.currentStock) < material.quantity) {
          throw new StockInsufficientException();
        }
        await this.stockRepository.applyStockMovement({
          transactionNumber,
          warehouseId: input.warehouseId,
          itemId: item.id,
          transactionType: 'TREATMENT',
          referenceType: REFERENCE_TYPE,
          referenceId: input.visitTreatmentId,
          qtyOut: material.quantity,
          transactionDate,
          performedBy: input.actorUserId,
        });
      }
    }

    const auditContext: AuditContext = { userId: input.actorUserId };
    await this.auditService.record(
      'VisitTreatmentMaterial',
      input.visitTreatmentId,
      'CREATE',
      null,
      { visitId: input.visitId, treatmentId: input.treatmentId, warehouseId: input.warehouseId, materials: input.materials },
      auditContext,
    );

    const eventPayload: MaterialConsumedEventPayload = {
      visitId: input.visitId,
      treatmentId: input.treatmentId,
      visitTreatmentId: input.visitTreatmentId,
      warehouseId: input.warehouseId,
      materials: input.materials,
    };
    await this.eventBus.publish('warehouse.material-consumed.v1', eventPayload);
  }

  private async consumeFromBatches(
    itemId: string,
    warehouseId: string,
    quantity: number,
    transactionDate: Date,
    input: ConsumeMaterialInput,
    referenceType: string,
  ): Promise<void> {
    const activeBatches = await this.batchRepository.findActiveByWarehouseAndItem(warehouseId, itemId);
    const validBatches = activeBatches
      .filter((b) => !b.expiryDate || b.expiryDate.getTime() >= transactionDate.getTime())
      .sort((a, b) => {
        if (!a.expiryDate && !b.expiryDate) return 0;
        if (!a.expiryDate) return 1;
        if (!b.expiryDate) return -1;
        return a.expiryDate.getTime() - b.expiryDate.getTime();
      });
    const expiredBatches = activeBatches.filter((b) => b.expiryDate && b.expiryDate.getTime() < transactionDate.getTime());

    const totalValidRemaining = validBatches.reduce((sum, b) => sum + Number(b.remainingQuantity), 0);
    if (totalValidRemaining < quantity) {
      if (expiredBatches.some((b) => Number(b.remainingQuantity) > 0)) {
        throw new BatchExpiredException();
      }
      throw new StockInsufficientException();
    }

    let remaining = quantity;
    for (const batch of validBatches) {
      if (remaining <= 0) break;
      const allocated = Math.min(remaining, Number(batch.remainingQuantity));
      if (allocated <= 0) continue;

      const transactionNumber = await this.numberGenerator.generate(transactionDate);
      await this.batchRepository.decrementRemaining(batch.id, allocated);
      await this.stockRepository.applyStockMovement({
        transactionNumber,
        warehouseId,
        itemId,
        batchId: batch.id,
        transactionType: 'TREATMENT',
        referenceType,
        referenceId: input.visitTreatmentId,
        qtyOut: allocated,
        transactionDate,
        performedBy: input.actorUserId,
      });

      remaining -= allocated;
    }
  }
}
