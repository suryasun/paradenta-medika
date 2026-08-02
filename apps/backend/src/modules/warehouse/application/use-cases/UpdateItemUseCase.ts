import { AuditContext, IAuditService } from '../../../system/domain/services/IAuditService';
import { ItemNotFoundException, ItemTrackingFlagsLockedException } from '../../domain/exceptions/WarehouseExceptions';
import { IItemRepository } from '../../domain/repositories/IItemRepository';
import { ItemResponseDto } from '../dtos/ItemResponseDto';
import { toItemResponseDto } from '../mappers/ItemMapper';

export interface UpdateItemInput {
  itemId: string;
  name?: string;
  categoryId?: string;
  unitId?: string;
  minimumStock?: number;
  purchasePrice?: number;
  sellingPrice?: number;
  isConsumable?: boolean;
  isBatchTracked?: boolean;
  isExpiryTracked?: boolean;
  isActive?: boolean;
  actorUserId: string;
  ipAddress?: string;
  correlationId?: string;
}

/**
 * docs/06-tasks/task-097.md AC: "Update rejects changing isBatchTracked/
 * isExpiryTracked if the item already has stock ledger entries" -- a
 * data-integrity rule (changing tracking mode after stock movements exist
 * would make existing StockTransaction/future-batch semantics inconsistent).
 */
export class UpdateItemUseCase {
  constructor(
    private readonly itemRepository: IItemRepository,
    private readonly auditService: IAuditService,
  ) {}

  async execute(input: UpdateItemInput): Promise<ItemResponseDto> {
    const existing = await this.itemRepository.findById(input.itemId);
    if (!existing) {
      throw new ItemNotFoundException();
    }

    const changesTrackingFlags =
      (input.isBatchTracked !== undefined && input.isBatchTracked !== existing.isBatchTracked) ||
      (input.isExpiryTracked !== undefined && input.isExpiryTracked !== existing.isExpiryTracked);
    if (changesTrackingFlags) {
      const hasLedgerEntries = await this.itemRepository.hasStockLedgerEntries(input.itemId);
      if (hasLedgerEntries) {
        throw new ItemTrackingFlagsLockedException();
      }
    }

    const updated = await this.itemRepository.update(input.itemId, {
      itemName: input.name,
      categoryId: input.categoryId,
      unitId: input.unitId,
      minimumStock: input.minimumStock,
      purchasePrice: input.purchasePrice,
      sellingPrice: input.sellingPrice,
      isConsumable: input.isConsumable,
      isBatchTracked: input.isBatchTracked,
      isExpiryTracked: input.isExpiryTracked,
      isActive: input.isActive,
      updatedBy: input.actorUserId,
    });

    const auditContext: AuditContext = { userId: input.actorUserId, ipAddress: input.ipAddress, correlationId: input.correlationId };
    await this.auditService.record('Item', input.itemId, 'UPDATE', existing, updated, auditContext);

    return toItemResponseDto(updated);
  }
}
