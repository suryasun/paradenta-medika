import { AuditContext, IAuditService } from '../../../system/domain/services/IAuditService';
import { ItemCodeExistsException } from '../../domain/exceptions/WarehouseExceptions';
import { IItemRepository } from '../../domain/repositories/IItemRepository';
import { ItemResponseDto } from '../dtos/ItemResponseDto';
import { toItemResponseDto } from '../mappers/ItemMapper';

export interface CreateItemInput {
  code: string;
  name: string;
  categoryId: string;
  unitId: string;
  minimumStock: number;
  purchasePrice?: number;
  sellingPrice?: number;
  isConsumable: boolean;
  isBatchTracked: boolean;
  isExpiryTracked: boolean;
  actorUserId: string;
  ipAddress?: string;
  correlationId?: string;
}

/** docs/06-tasks/task-096.md; docs/03-sad/18-module-warehouse.md Section 6.1. */
export class CreateItemUseCase {
  constructor(
    private readonly itemRepository: IItemRepository,
    private readonly auditService: IAuditService,
  ) {}

  async execute(input: CreateItemInput): Promise<ItemResponseDto> {
    const existing = await this.itemRepository.findByCode(input.code);
    if (existing) {
      throw new ItemCodeExistsException();
    }

    const item = await this.itemRepository.create({
      itemCode: input.code,
      itemName: input.name,
      categoryId: input.categoryId,
      unitId: input.unitId,
      minimumStock: input.minimumStock,
      purchasePrice: input.purchasePrice,
      sellingPrice: input.sellingPrice,
      isConsumable: input.isConsumable,
      isBatchTracked: input.isBatchTracked,
      isExpiryTracked: input.isExpiryTracked,
      createdBy: input.actorUserId,
    });

    const auditContext: AuditContext = { userId: input.actorUserId, ipAddress: input.ipAddress, correlationId: input.correlationId };
    await this.auditService.record('Item', item.id, 'CREATE', null, { code: input.code, name: input.name }, auditContext);

    return toItemResponseDto(item);
  }
}
