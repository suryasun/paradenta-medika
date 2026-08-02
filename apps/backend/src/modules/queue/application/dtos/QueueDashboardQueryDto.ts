import { IsDateString, IsOptional, IsUUID } from 'class-validator';

export class QueueDashboardQueryDto {
  @IsOptional() @IsUUID('4') branchId?: string;
  @IsOptional() @IsDateString() date?: string;
}
