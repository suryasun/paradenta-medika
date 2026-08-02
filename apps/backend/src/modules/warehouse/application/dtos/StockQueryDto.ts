import { IsOptional, IsUUID } from 'class-validator';
import { ListQueryDto } from '../../../../shared/http/ListQueryDto';

/** docs/03-sad/18-module-warehouse.md Section 6.1: exact filter fields beyond item/warehouse are NOT DEFINED IN SAD. */
export class StockQueryDto extends ListQueryDto {
  @IsOptional() @IsUUID('4') itemId?: string;
  @IsOptional() @IsUUID('4') warehouseId?: string;
}
