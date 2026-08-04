import { IsIn, IsOptional, IsUUID } from 'class-validator';
import { ListQueryDto } from '../../../../shared/http/ListQueryDto';

const DIRECTIONS = ['IN', 'OUT'] as const;
const STATUSES = ['DRAFT', 'APPROVED', 'POSTED'] as const;

export class ListStockAdjustmentQueryDto extends ListQueryDto {
  @IsOptional() @IsUUID('4') warehouseId?: string;
  @IsOptional() @IsIn(DIRECTIONS) direction?: (typeof DIRECTIONS)[number];
  @IsOptional() @IsIn(STATUSES) status?: (typeof STATUSES)[number];
}
