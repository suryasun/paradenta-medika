import { PurchaseOrderNotFoundException } from '../../domain/exceptions/WarehouseExceptions';
import { IPurchaseOrderRepository } from '../../domain/repositories/IPurchaseOrderRepository';
import { PurchaseOrderResponseDto } from '../dtos/PurchaseOrderResponseDto';
import { toPurchaseOrderResponseDto } from '../mappers/PurchaseOrderMapper';

export class GetPurchaseOrderUseCase {
  constructor(private readonly purchaseOrderRepository: IPurchaseOrderRepository) {}

  async execute(id: string): Promise<PurchaseOrderResponseDto> {
    const po = await this.purchaseOrderRepository.findById(id);
    if (!po) {
      throw new PurchaseOrderNotFoundException();
    }
    return toPurchaseOrderResponseDto(po);
  }
}
