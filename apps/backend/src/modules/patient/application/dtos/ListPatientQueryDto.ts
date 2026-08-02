import { IsIn, IsOptional } from 'class-validator';
import { ListQueryDto } from '../../../../shared/http/ListQueryDto';

/**
 * docs/03-sad/12-module-patient.md Section 20.3 adds `status`/`gender`
 * filters on top of the generic list contract. `keyword`/`orderBy` from
 * that same section are superseded by `search`/`sort`
 * (docs/04-ai-contract/04-api-contract.md API-063/API-067, priority 1).
 */
export class ListPatientQueryDto extends ListQueryDto {
  @IsOptional() @IsIn(['ACTIVE', 'ARCHIVED']) status?: 'ACTIVE' | 'ARCHIVED';
  @IsOptional() @IsIn(['MALE', 'FEMALE']) gender?: 'MALE' | 'FEMALE';
}
