import { FinanceAccountMapping } from '@prisma/client';
import { ListQueryDto } from '../../../../shared/http/ListQueryDto';
import { PagedResult } from '../../../../shared/http/pagination';

export interface CreateFinanceAccountMappingInput {
  branchId: string;
  paymentMethodId: string;
  cashAccountId: string;
  revenueAccountId: string;
  createdBy: string;
}

export interface IFinanceAccountMappingRepository {
  create(input: CreateFinanceAccountMappingInput): Promise<FinanceAccountMapping>;
  list(query: ListQueryDto, filter: { branchId?: string }): Promise<PagedResult<FinanceAccountMapping>>;
  findById(id: string): Promise<FinanceAccountMapping | null>;
  /** docs/06-tasks/task-162.md: the lookup UC-FIN-001 uses to resolve which accounts a Billing payment posts to. */
  findByBranchAndPaymentMethod(branchId: string, paymentMethodId: string): Promise<FinanceAccountMapping | null>;
}
