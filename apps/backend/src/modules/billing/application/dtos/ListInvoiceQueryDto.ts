import { IsDateString, IsIn, IsOptional, IsUUID } from 'class-validator';
import { ListQueryDto } from '../../../../shared/http/ListQueryDto';

// docs/03-sad/16-module-billing.md Section 7 "List Invoice" > Filtering:
// status, patientId, doctorId, branchId, dateFrom, dateTo. `doctorId` is
// documented there but is not a column on billing_invoices (no direct FK --
// it only exists on the source Visit); task-055.md only requires "the
// standard list-endpoint contract" with "status/date filters", so doctorId
// filtering is left out rather than adding an undocumented join.
export class ListInvoiceQueryDto extends ListQueryDto {
  @IsOptional() @IsIn(['UNPAID', 'PARTIALLY_PAID', 'PAID', 'CLOSED']) status?: string;
  @IsOptional() @IsUUID('4') patientId?: string;
  @IsOptional() @IsUUID('4') branchId?: string;
  @IsOptional() @IsDateString() dateFrom?: string;
  @IsOptional() @IsDateString() dateTo?: string;
}
