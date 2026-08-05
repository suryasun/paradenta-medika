import { IsOptional, IsUUID } from 'class-validator';

/** docs/06-tasks/task-285.md: cascading-dropdown parent filters. */
export class ListRegenciesQueryDto {
  @IsOptional() @IsUUID('4') provinceId?: string;
}

export class ListDistrictsQueryDto {
  @IsOptional() @IsUUID('4') regencyId?: string;
}

export class ListVillagesQueryDto {
  @IsOptional() @IsUUID('4') districtId?: string;
}
