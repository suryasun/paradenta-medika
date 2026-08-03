import { IsBooleanString, IsIn, IsOptional, IsUUID } from 'class-validator';
import { ListQueryDto } from '../../../../shared/http/ListQueryDto';

const ACCOUNT_TYPES = ['cash', 'bank', 'clearing'] as const;

export class ListCashAccountQueryDto extends ListQueryDto {
  @IsOptional() @IsUUID('4') branchId?: string;
  @IsOptional() @IsIn(ACCOUNT_TYPES) accountType?: (typeof ACCOUNT_TYPES)[number];
  @IsOptional() @IsBooleanString() isActive?: string;
}
