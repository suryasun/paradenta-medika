import { IsDateString, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class CreateFinancialPeriodRequestDto {
  @IsUUID('4') branchId!: string;
  @IsString() @MinLength(1) @MaxLength(100) periodName!: string;
  @IsDateString() startDate!: string;
  @IsDateString() endDate!: string;
}
