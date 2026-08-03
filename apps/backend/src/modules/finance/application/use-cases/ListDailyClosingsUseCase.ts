import { DailyClosingStatus } from '@prisma/client';
import { PagedResult } from '../../../../shared/http/pagination';
import { IDailyClosingRepository } from '../../domain/repositories/IDailyClosingRepository';
import { ListDailyClosingQueryDto } from '../dtos/DailyClosingQueryDto';
import { DailyClosingResponseDto } from '../dtos/DailyClosingResponseDto';
import { toDailyClosingResponseDto } from '../mappers/DailyClosingMapper';

export class ListDailyClosingsUseCase {
  constructor(private readonly dailyClosingRepository: IDailyClosingRepository) {}

  async execute(query: ListDailyClosingQueryDto): Promise<PagedResult<DailyClosingResponseDto>> {
    const { items, total } = await this.dailyClosingRepository.list(query, {
      branchId: query.branchId,
      cashAccountId: query.cashAccountId,
      status: query.status as DailyClosingStatus | undefined,
      dateFrom: query.dateFrom ? new Date(query.dateFrom) : undefined,
      dateTo: query.dateTo ? new Date(query.dateTo) : undefined,
    });
    return { items: items.map(toDailyClosingResponseDto), total };
  }
}
