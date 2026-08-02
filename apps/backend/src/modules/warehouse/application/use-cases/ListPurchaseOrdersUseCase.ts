import { PurchaseOrderStatus } from '@prisma/client';
import { PagedResult } from '../../../../shared/http/pagination';
import { IPurchaseOrderRepository } from '../../domain/repositories/IPurchaseOrderRepository';
import { ListPurchaseOrderQueryDto } from '../dtos/PurchaseOrderQueryDto';
import { PurchaseOrderResponseDto } from '../dtos/PurchaseOrderResponseDto';
import { toPurchaseOrderResponseDto } from '../mappers/PurchaseOrderMapper';

/** docs/06-tasks/task-105.md AC: "List supports pagination/filter by status, supplier, warehouse." */
export class ListPurchaseOrdersUseCase {
  constructor(private readonly purchaseOrderRepository: IPurchaseOrderRepository) {}

  async execute(query: ListPurchaseOrderQueryDto): Promise<PagedResult<PurchaseOrderResponseDto>> {
    const { items, total } = await this.purchaseOrderRepository.list(query, {
      status: query.status as PurchaseOrderStatus | undefined,
      supplierId: query.supplierId,
      warehouseId: query.warehouseId,
    });
    return { items: items.map(toPurchaseOrderResponseDto), total };
  }
}
