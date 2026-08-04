import { Account, FinanceAccountType, FinanceNormalBalance } from '@prisma/client';
import { ListQueryDto } from '../../../../shared/http/ListQueryDto';
import { PagedResult } from '../../../../shared/http/pagination';

export interface CreateAccountInput {
  branchId?: string | null;
  code: string;
  name: string;
  accountType: FinanceAccountType;
  normalBalance: FinanceNormalBalance;
  parentId?: string | null;
  isPostable: boolean;
  createdBy: string;
}

export interface UpdateAccountInput {
  name?: string;
  accountType?: FinanceAccountType;
  normalBalance?: FinanceNormalBalance;
  parentId?: string | null;
  isPostable?: boolean;
  updatedBy: string;
}

export interface AccountListFilter {
  branchId?: string;
  accountType?: FinanceAccountType;
  isActive?: boolean;
  isPostable?: boolean;
  parentId?: string;
}

export interface IAccountRepository {
  create(input: CreateAccountInput): Promise<Account>;
  list(query: ListQueryDto, filter: AccountListFilter): Promise<PagedResult<Account>>;
  findById(id: string): Promise<Account | null>;
  /** `branchId: null` looks up the shared-template scope, not "any branch". */
  findByBranchAndCode(branchId: string | null, code: string): Promise<Account | null>;
  update(id: string, input: UpdateAccountInput): Promise<Account>;
  deactivate(id: string, updatedBy: string): Promise<Account>;
  /** docs/06-tasks/task-224.md: every shared-template (branchId=null) account, mirrored into a newly bootstrapped branch's starter Chart of Accounts. */
  listTemplateAccounts(): Promise<Account[]>;
}
