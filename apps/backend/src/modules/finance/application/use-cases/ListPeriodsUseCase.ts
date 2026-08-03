import { FinancialPeriodStatus } from '@prisma/client';
import { PagedResult } from '../../../../shared/http/pagination';
import { IFinancialPeriodRepository } from '../../domain/repositories/IFinancialPeriodRepository';
import { ListFinancialPeriodQueryDto } from '../dtos/FinancialPeriodQueryDto';
import { FinancialPeriodResponseDto } from '../dtos/FinancialPeriodResponseDto';
import { toFinancialPeriodResponseDto } from '../mappers/FinancialPeriodMapper';

export class ListPeriodsUseCase {
  constructor(private readonly financialPeriodRepository: IFinancialPeriodRepository) {}

  async execute(query: ListFinancialPeriodQueryDto): Promise<PagedResult<FinancialPeriodResponseDto>> {
    const { items, total } = await this.financialPeriodRepository.list(query, {
      branchId: query.branchId,
      status: query.status as FinancialPeriodStatus | undefined,
    });
    return { items: items.map(toFinancialPeriodResponseDto), total };
  }
}
