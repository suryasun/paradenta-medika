import { Account, FinanceAccountType, FinanceNormalBalance } from '@prisma/client';
import { AccountResponseDto } from '../dtos/AccountResponseDto';

const ACCOUNT_TYPE_TO_PRISMA: Record<string, FinanceAccountType> = {
  asset: 'ASSET',
  liability: 'LIABILITY',
  equity: 'EQUITY',
  revenue: 'REVENUE',
  expense: 'EXPENSE',
};

const NORMAL_BALANCE_TO_PRISMA: Record<string, FinanceNormalBalance> = {
  debit: 'DEBIT',
  credit: 'CREDIT',
};

export function toPrismaAccountType(dtoValue: string): FinanceAccountType {
  return ACCOUNT_TYPE_TO_PRISMA[dtoValue];
}

export function toPrismaNormalBalance(dtoValue: string): FinanceNormalBalance {
  return NORMAL_BALANCE_TO_PRISMA[dtoValue];
}

export function toAccountResponseDto(account: Account): AccountResponseDto {
  return {
    id: account.id,
    branchId: account.branchId,
    code: account.code,
    name: account.name,
    accountType: account.accountType.toLowerCase(),
    normalBalance: account.normalBalance.toLowerCase(),
    parentId: account.parentId,
    isPostable: account.isPostable,
    isActive: account.isActive,
    createdAt: account.createdAt.toISOString(),
    createdBy: account.createdBy,
  };
}
