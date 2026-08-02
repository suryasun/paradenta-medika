import { FinanceAccountType } from '@prisma/client';
import { PagedResult } from '../../../../shared/http/pagination';
import { AccountListFilter, IAccountRepository } from '../../domain/repositories/IAccountRepository';
import { ListAccountQueryDto } from '../dtos/AccountQueryDto';
import { AccountResponseDto } from '../dtos/AccountResponseDto';
import { toAccountResponseDto, toPrismaAccountType } from '../mappers/AccountMapper';

export class ListAccountsUseCase {
  constructor(private readonly accountRepository: IAccountRepository) {}

  async execute(query: ListAccountQueryDto): Promise<PagedResult<AccountResponseDto>> {
    const filter: AccountListFilter = {
      branchId: query.branchId,
      accountType: query.accountType ? (toPrismaAccountType(query.accountType) as FinanceAccountType) : undefined,
      parentId: query.parentId,
      isActive: query.isActive !== undefined ? query.isActive === 'true' : undefined,
      isPostable: query.isPostable !== undefined ? query.isPostable === 'true' : undefined,
    };
    const { items, total } = await this.accountRepository.list(query, filter);
    return { items: items.map(toAccountResponseDto), total };
  }
}
