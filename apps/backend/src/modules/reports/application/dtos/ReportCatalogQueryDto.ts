import { IsDateString, IsOptional, IsString, IsUUID } from 'class-validator';

/** docs/06-tasks/task-186.md: `GET /reports/{reportCode}` accepts a heterogeneous filter set (branchId, periodId, date range, warehouseId/itemId, etc.) depending on which catalog entry `reportCode` resolves to -- validated per-code inside GetReportUseCase rather than by one rigid DTO. */
export class ReportCatalogQueryDto {
  @IsOptional() @IsUUID('4') branchId?: string;
  // Phase 4 hardening: branch.comparison's multi-branch filter, same
  // comma-separated convention as BranchComparisonQueryDto's own
  // `branchIds` field (parsed in ReportCatalogController.getReport).
  @IsOptional() @IsString() branchIds?: string;
  @IsOptional() @IsUUID('4') periodId?: string;
  @IsOptional() @IsDateString() dateFrom?: string;
  @IsOptional() @IsDateString() dateTo?: string;
  @IsOptional() @IsUUID('4') accountId?: string;
  @IsOptional() @IsUUID('4') warehouseId?: string;
  @IsOptional() @IsUUID('4') itemId?: string;
  @IsOptional() @IsString() status?: string;
  @IsOptional() @IsDateString() expiryFrom?: string;
  @IsOptional() @IsDateString() expiryTo?: string;
}
