import { IsIn, IsOptional, IsUUID } from 'class-validator';
import { ListQueryDto } from '../../../../shared/http/ListQueryDto';

const STATUSES = ['DRAFT', 'COUNTING', 'SUBMITTED', 'APPROVED', 'POSTED', 'REJECTED'] as const;

export class ListStockOpnameQueryDto extends ListQueryDto {
  @IsOptional() @IsUUID('4') warehouseId?: string;
  @IsOptional() @IsIn(STATUSES) status?: (typeof STATUSES)[number];
}
