import { PagedResult } from '../../../../shared/http/pagination';
import { IQueueRepository, QueueListFilters } from '../../domain/repositories/IQueueRepository';
import { QueueResponseDto } from '../dtos/QueueResponseDto';
import { toQueueResponse } from '../mappers/QueueMapper';

export class ListQueueUseCase {
  constructor(private readonly queueRepository: IQueueRepository) {}

  async execute(filters: QueueListFilters): Promise<PagedResult<QueueResponseDto>> {
    const { items, total } = await this.queueRepository.search(filters);
    return { items: items.map(toQueueResponse), total };
  }
}
