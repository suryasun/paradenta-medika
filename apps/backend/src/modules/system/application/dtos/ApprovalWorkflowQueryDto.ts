import { IsIn, IsOptional, IsString, IsUUID } from 'class-validator';
import { ListQueryDto } from '../../../../shared/http/ListQueryDto';

export class ListSystemParameterQueryDto extends ListQueryDto {
  @IsOptional() @IsString() key?: string;
  @IsOptional() @IsIn(['GLOBAL', 'BRANCH']) scopeType?: string;
  @IsOptional() @IsUUID('4') scopeId?: string;
}

export class ListFeatureFlagQueryDto extends ListQueryDto {
  @IsOptional() @IsString() ownerModule?: string;
}
