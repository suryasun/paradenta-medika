import { IsOptional, IsUUID } from 'class-validator';

export class OperationsDashboardQueryDto {
  @IsOptional() @IsUUID('4') branchId?: string;
}
