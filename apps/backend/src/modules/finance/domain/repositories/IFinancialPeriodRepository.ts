import { FinancialPeriod, FinancialPeriodStatus } from '@prisma/client';
import { ListQueryDto } from '../../../../shared/http/ListQueryDto';
import { PagedResult } from '../../../../shared/http/pagination';

export interface CreateFinancialPeriodInput {
  branchId: string;
  periodName: string;
  startDate: Date;
  endDate: Date;
  createdBy: string;
}

export interface FinancialPeriodListFilter {
  branchId?: string;
  status?: FinancialPeriodStatus;
}

export interface IFinancialPeriodRepository {
  create(input: CreateFinancialPeriodInput): Promise<FinancialPeriod>;
  list(query: ListQueryDto, filter: FinancialPeriodListFilter): Promise<PagedResult<FinancialPeriod>>;
  findById(id: string): Promise<FinancialPeriod | null>;
  /** Non-CLOSED (OPEN/LOCKED) periods for a branch whose range overlaps [startDate, endDate]. */
  findOverlapping(branchId: string, startDate: Date, endDate: Date): Promise<FinancialPeriod[]>;
  /** The OPEN period (if any) covering the given branch/date, used to gate journal posting. */
  findOpenPeriodForDate(branchId: string, date: Date): Promise<FinancialPeriod | null>;
}
