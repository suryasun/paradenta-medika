import { ListQueryDto } from '../../../../shared/http/ListQueryDto';
import { PagedResult } from '../../../../shared/http/pagination';
import { IItemRepository } from '../../domain/repositories/IItemRepository';
import { ItemResponseDto } from '../dtos/ItemResponseDto';
import { toItemResponseDto } from '../mappers/ItemMapper';

export class ListItemsUseCase {
  constructor(private readonly itemRepository: IItemRepository) {}

  async execute(query: ListQueryDto): Promise<PagedResult<ItemResponseDto>> {
    const { items, total } = await this.itemRepository.list(query);
    return { items: items.map(toItemResponseDto), total };
  }
}
