import { FinanceJournalStatus } from '@prisma/client';
import { PagedResult } from '../../../../shared/http/pagination';
import { IJournalRepository } from '../../domain/repositories/IJournalRepository';
import { ListJournalQueryDto } from '../dtos/JournalQueryDto';
import { JournalResponseDto } from '../dtos/JournalResponseDto';
import { toJournalResponseDto } from '../mappers/JournalMapper';

export class ListJournalsUseCase {
  constructor(private readonly journalRepository: IJournalRepository) {}

  async execute(query: ListJournalQueryDto): Promise<PagedResult<JournalResponseDto>> {
    const { items, total } = await this.journalRepository.list(query, {
      branchId: query.branchId,
      status: query.status as FinanceJournalStatus | undefined,
      dateFrom: query.dateFrom ? new Date(query.dateFrom) : undefined,
      dateTo: query.dateTo ? new Date(query.dateTo) : undefined,
      accountId: query.accountId,
    });
    return { items: items.map(toJournalResponseDto), total };
  }
}
