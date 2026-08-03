import { DailyClosing, DailyClosingStatus } from '@prisma/client';
import { ListQueryDto } from '../../../../shared/http/ListQueryDto';
import { PagedResult } from '../../../../shared/http/pagination';

export interface CreateDailyClosingInput {
  branchId: string;
  cashAccountId: string;
  cashierId: string;
  closingDate: Date;
  expectedBalance: number;
  countedBalance: number;
  variance: number;
  varianceReason?: string;
  denominations?: unknown;
  createdBy: string;
}

export interface DailyClosingListFilter {
  branchId?: string;
  cashAccountId?: string;
  status?: DailyClosingStatus;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface IDailyClosingRepository {
  create(input: CreateDailyClosingInput): Promise<DailyClosing>;
  list(query: ListQueryDto, filter: DailyClosingListFilter): Promise<PagedResult<DailyClosing>>;
  findById(id: string): Promise<DailyClosing | null>;
  findExisting(branchId: string, cashAccountId: string, cashierId: string, closingDate: Date): Promise<DailyClosing | null>;
  approve(id: string, approvedBy: string, approvedAt: Date): Promise<DailyClosing>;
}
