import { IsDateString, IsIn, IsOptional, IsUUID } from 'class-validator';
import { ListQueryDto } from '../../../../shared/http/ListQueryDto';

const TRANSACTION_TYPES = [
  'PURCHASE',
  'SALE',
  'TREATMENT',
  'ADJUSTMENT',
  'TRANSFER',
  'OPNAME',
  'RETURN',
  'RESERVATION',
  'RELEASE_RESERVATION',
] as const;

const PO_STATUSES = ['DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'CANCELLED', 'PARTIALLY_RECEIVED', 'RECEIVED'] as const;

/** docs/06-tasks/task-137.md: "Kartu stok" -- always scoped to one item/warehouse pair. */
export class StockCardQueryDto extends ListQueryDto {
  @IsUUID('4') warehouseId!: string;
  @IsUUID('4') itemId!: string;
  @IsOptional() @IsDateString() dateFrom?: string;
  @IsOptional() @IsDateString() dateTo?: string;
}

/** docs/06-tasks/task-139.md: "In/out by type, reference, actor" -- broader, filter-driven, not item-scoped. */
export class MovementsQueryDto extends ListQueryDto {
  @IsOptional() @IsUUID('4') warehouseId?: string;
  @IsOptional() @IsUUID('4') itemId?: string;
  @IsOptional() @IsIn(TRANSACTION_TYPES) transactionType?: (typeof TRANSACTION_TYPES)[number];
  @IsOptional() referenceType?: string;
  @IsOptional() @IsUUID('4') performedBy?: string;
  @IsOptional() @IsDateString() dateFrom?: string;
  @IsOptional() @IsDateString() dateTo?: string;
}

/** docs/06-tasks/task-140.md: "PO/receipt/vendor analysis". */
export class PurchasesReportQueryDto extends ListQueryDto {
  @IsOptional() @IsUUID('4') warehouseId?: string;
  @IsOptional() @IsUUID('4') supplierId?: string;
  @IsOptional() @IsIn(PO_STATUSES) status?: (typeof PO_STATUSES)[number];
  @IsOptional() @IsDateString() dateFrom?: string;
  @IsOptional() @IsDateString() dateTo?: string;
}
