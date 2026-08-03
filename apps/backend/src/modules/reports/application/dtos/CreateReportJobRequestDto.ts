import { IsIn, IsObject, IsOptional, IsString } from 'class-validator';

const FORMATS = ['csv', 'json'] as const;

/**
 * docs/03-sad/20-module-report.md Section 6.2 "Create report job"
 * example. Avoids `@ValidateNested()/@Type()` (class-validator +
 * class-transformer) because those require the `reflect-metadata`
 * polyfill, which is not an approved dependency in this codebase (see
 * CreatePaymentRequestDto.ts/RecordDiagnosisRequestDto.ts for the prior
 * occurrences of this constraint) -- `filters` is validated loosely here
 * (`@IsObject()`) and its individual fields are validated inside
 * CreateReportJobUseCase, the same "structural validation in the use
 * case instead" pattern already established for nested request bodies.
 */
export interface ReportJobFilters {
  branchIds?: string[];
  dateFrom?: string;
  dateTo?: string;
  periodId?: string;
  warehouseId?: string;
  itemId?: string;
  status?: string;
}

export class CreateReportJobRequestDto {
  @IsOptional() @IsObject() filters?: ReportJobFilters;
  @IsOptional() @IsIn(FORMATS) format?: (typeof FORMATS)[number];
  @IsOptional() @IsString() timezone?: string;
}
