import { IsIn, IsOptional, IsUUID } from 'class-validator';
import { ListQueryDto } from '../../../../shared/http/ListQueryDto';

const STATUSES = ['DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'CANCELLED', 'PARTIALLY_RECEIVED', 'RECEIVED'] as const;

export class ListPurchaseOrderQueryDto extends ListQueryDto {
  @IsOptional() @IsIn(STATUSES) status?: (typeof STATUSES)[number];
  @IsOptional() @IsUUID('4') supplierId?: string;
  @IsOptional() @IsUUID('4') warehouseId?: string;
}
