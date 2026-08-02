import { ItemBatchStatus } from '@prisma/client';
import { PagedResult } from '../../../../shared/http/pagination';
import { IBatchRepository } from '../../domain/repositories/IBatchRepository';
import { ListBatchQueryDto } from '../dtos/BatchQueryDto';
import { BatchResponseDto } from '../dtos/BatchResponseDto';
import { toBatchResponseDto } from '../mappers/BatchMapper';

/** docs/06-tasks/task-134.md AC: "List supports filter by itemId, warehouseId, expiry range, status." */
export class ListBatchesUseCase {
  constructor(private readonly batchRepository: IBatchRepository) {}

  async execute(query: ListBatchQueryDto): Promise<PagedResult<BatchResponseDto>> {
    const { items, total } = await this.batchRepository.list(query, {
      itemId: query.itemId,
      warehouseId: query.warehouseId,
      status: query.status as ItemBatchStatus | undefined,
      expiryFrom: query.expiryFrom ? new Date(query.expiryFrom) : undefined,
      expiryTo: query.expiryTo ? new Date(query.expiryTo) : undefined,
    });
    return { items: items.map(toBatchResponseDto), total };
  }
}
