import { IsIn, IsOptional, IsUUID } from 'class-validator';
import { ListQueryDto } from '../../../../shared/http/ListQueryDto';

const STATUSES = ['DRAFT', 'SUBMITTED', 'APPROVED', 'DISPATCHED', 'RECEIVED'] as const;

export class ListStockTransferQueryDto extends ListQueryDto {
  @IsOptional() @IsUUID('4') sourceWarehouseId?: string;
  @IsOptional() @IsUUID('4') destinationWarehouseId?: string;
  @IsOptional() @IsIn(STATUSES) status?: (typeof STATUSES)[number];
}
