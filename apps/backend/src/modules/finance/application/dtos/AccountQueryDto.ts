import { IsBooleanString, IsIn, IsOptional, IsUUID } from 'class-validator';
import { ListQueryDto } from '../../../../shared/http/ListQueryDto';

const ACCOUNT_TYPES = ['asset', 'liability', 'equity', 'revenue', 'expense'] as const;

export class ListAccountQueryDto extends ListQueryDto {
  @IsOptional() @IsUUID('4') branchId?: string;
  @IsOptional() @IsIn(ACCOUNT_TYPES) accountType?: (typeof ACCOUNT_TYPES)[number];
  @IsOptional() @IsUUID('4') parentId?: string;
  @IsOptional() @IsBooleanString() isActive?: string;
  @IsOptional() @IsBooleanString() isPostable?: string;
}
