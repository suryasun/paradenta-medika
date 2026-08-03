import { CashAccountType } from '@prisma/client';
import { PagedResult } from '../../../../shared/http/pagination';
import { ICashAccountRepository } from '../../domain/repositories/ICashAccountRepository';
import { ListCashAccountQueryDto } from '../dtos/CashAccountQueryDto';
import { CashAccountResponseDto } from '../dtos/CashAccountResponseDto';
import { toCashAccountResponseDto } from '../mappers/CashAccountMapper';

const ACCOUNT_TYPE_TO_PRISMA: Record<string, CashAccountType> = { cash: 'CASH', bank: 'BANK', clearing: 'CLEARING' };

export class ListCashAccountsUseCase {
  constructor(private readonly cashAccountRepository: ICashAccountRepository) {}

  async execute(query: ListCashAccountQueryDto): Promise<PagedResult<CashAccountResponseDto>> {
    const { items, total } = await this.cashAccountRepository.list(query, {
      branchId: query.branchId,
      accountType: query.accountType ? ACCOUNT_TYPE_TO_PRISMA[query.accountType] : undefined,
      isActive: query.isActive !== undefined ? query.isActive === 'true' : undefined,
    });
    return { items: items.map(toCashAccountResponseDto), total };
  }
}
