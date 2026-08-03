import { IsArray, IsDateString, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';

export interface DenominationEntryDto {
  nominal: number;
  quantity: number;
}

/** docs/03-sad/17-module-finance.md Section 6.4 literal Daily Close request example. */
export class CreateDailyClosingRequestDto {
  @IsUUID('4') branchId!: string;
  @IsUUID('4') cashAccountId!: string;
  @IsUUID('4') cashierId!: string;
  @IsDateString() closingDate!: string;
  @IsNumber() countedBalance!: number;
  @IsOptional() @IsArray() denominations?: DenominationEntryDto[];
  @IsOptional() @IsString() varianceReason?: string;
}
