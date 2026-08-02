import { ItemNotFoundException } from '../../domain/exceptions/WarehouseExceptions';
import { IItemRepository } from '../../domain/repositories/IItemRepository';
import { ItemResponseDto } from '../dtos/ItemResponseDto';
import { toItemResponseDto } from '../mappers/ItemMapper';

export class GetItemUseCase {
  constructor(private readonly itemRepository: IItemRepository) {}

  async execute(id: string): Promise<ItemResponseDto> {
    const item = await this.itemRepository.findById(id);
    if (!item) {
      throw new ItemNotFoundException();
    }
    return toItemResponseDto(item);
  }
}
