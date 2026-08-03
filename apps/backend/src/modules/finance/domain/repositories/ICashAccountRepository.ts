import { CashAccount, CashAccountType } from '@prisma/client';
import { ListQueryDto } from '../../../../shared/http/ListQueryDto';
import { PagedResult } from '../../../../shared/http/pagination';

export interface CreateCashAccountInput {
  branchId: string;
  code: string;
  name: string;
  accountType: CashAccountType;
  ledgerAccountId: string;
  accountNumber?: string;
  createdBy: string;
}

export interface CashAccountListFilter {
  branchId?: string;
  accountType?: CashAccountType;
  isActive?: boolean;
}

export interface ICashAccountRepository {
  create(input: CreateCashAccountInput): Promise<CashAccount>;
  list(query: ListQueryDto, filter: CashAccountListFilter): Promise<PagedResult<CashAccount>>;
  findById(id: string): Promise<CashAccount | null>;
  findByBranchAndCode(branchId: string, code: string): Promise<CashAccount | null>;
  /** Adjusts `currentBalance` by `delta` (positive or negative) atomically. */
  adjustBalance(id: string, delta: number): Promise<CashAccount>;
}
