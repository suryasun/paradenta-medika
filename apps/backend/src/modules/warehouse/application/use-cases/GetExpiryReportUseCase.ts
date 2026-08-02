import { ItemBatchStatus } from '@prisma/client';
import { PagedResult } from '../../../../shared/http/pagination';
import { IBatchRepository } from '../../domain/repositories/IBatchRepository';
import { ListBatchQueryDto } from '../dtos/BatchQueryDto';
import { BatchResponseDto } from '../dtos/BatchResponseDto';
import { toBatchResponseDto } from '../mappers/BatchMapper';

/**
 * docs/06-tasks/task-141.md: "Near-expiry, expired, quarantine stock and
 * remaining quantity" -- the same shape `GET /warehouse/batches`
 * (task-134) already returns, exposed as its own reports-namespaced,
 * `warehouse.report.read`-gated endpoint, reusing `IBatchRepository.list`
 * rather than duplicating the filter logic.
 */
export class GetExpiryReportUseCase {
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
