import { IsDateString, IsIn, IsOptional, IsString, IsUUID } from 'class-validator';
import { ListQueryDto } from '../../../../shared/http/ListQueryDto';

const EXPENSE_STATUSES = ['DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'PAID', 'CANCELLED'] as const;
const CLOSING_STATUSES = ['SUBMITTED', 'APPROVED'] as const;

/**
 * docs/03-sad/17-module-finance.md Section 6.5: "requires branchId,
 * dateFrom, and dateTo unless the report uses periodId" -- branchId is
 * mandatory here (unlike the branch-optional list-endpoint DTOs), while
 * dateFrom/dateTo/periodId stay optional at the validator level since
 * they're alternatives; ReportDateRangeResolver enforces the actual
 * "one of the two" business rule.
 */
export class TrialBalanceQueryDto extends ListQueryDto {
  @IsUUID('4') branchId!: string;
  @IsOptional() @IsUUID('4') periodId?: string;
  @IsOptional() @IsDateString() dateFrom?: string;
  @IsOptional() @IsDateString() dateTo?: string;
}

export class GeneralLedgerQueryDto extends TrialBalanceQueryDto {
  @IsOptional() @IsUUID('4') accountId?: string;
}

export class IncomeStatementQueryDto extends TrialBalanceQueryDto {}

export class CashFlowQueryDto extends TrialBalanceQueryDto {
  @IsOptional() @IsUUID('4') cashAccountId?: string;
}

export class ExpensesReportQueryDto extends TrialBalanceQueryDto {
  @IsOptional() @IsString() category?: string;
  @IsOptional() @IsIn(EXPENSE_STATUSES) status?: (typeof EXPENSE_STATUSES)[number];
}

export class DailyClosingReportQueryDto extends TrialBalanceQueryDto {
  @IsOptional() @IsUUID('4') cashAccountId?: string;
  @IsOptional() @IsIn(CLOSING_STATUSES) status?: (typeof CLOSING_STATUSES)[number];
}
