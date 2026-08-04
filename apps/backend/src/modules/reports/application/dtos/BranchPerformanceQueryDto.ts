import { IsDateString, IsUUID } from 'class-validator';

export class BranchPerformanceQueryDto {
  @IsUUID('4') branchId!: string;
  @IsDateString() dateFrom!: string;
  @IsDateString() dateTo!: string;
}
