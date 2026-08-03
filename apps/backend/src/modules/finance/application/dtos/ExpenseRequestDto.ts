import { IsDateString, IsNumber, IsOptional, IsPositive, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class CreateExpenseRequestDto {
  @IsUUID('4') branchId!: string;
  @IsDateString() expenseDate!: string;
  @IsString() @MinLength(1) @MaxLength(30) category!: string;
  @IsUUID('4') expenseAccountId!: string;
  @IsNumber() @IsPositive() amount!: number;
  @IsOptional() @IsString() @MaxLength(150) payeeName?: string;
  @IsOptional() @IsString() @MaxLength(2000) description?: string;
  @IsOptional() @IsString() @MaxLength(500) evidenceUrl?: string;
}

export class UpdateExpenseRequestDto {
  @IsOptional() @IsDateString() expenseDate?: string;
  @IsOptional() @IsString() @MinLength(1) @MaxLength(30) category?: string;
  @IsOptional() @IsUUID('4') expenseAccountId?: string;
  @IsOptional() @IsNumber() @IsPositive() amount?: number;
  @IsOptional() @IsString() @MaxLength(150) payeeName?: string;
  @IsOptional() @IsString() @MaxLength(2000) description?: string;
  @IsOptional() @IsString() @MaxLength(500) evidenceUrl?: string;
}

export class RejectExpenseRequestDto {
  @IsString() @MinLength(1) reason!: string;
}

/** docs/03-sad/17-module-finance.md Section 6.3 literal Pay Expense example. */
export class PayExpenseRequestDto {
  @IsUUID('4') cashAccountId!: string;
  @IsDateString() paymentDate!: string;
  @IsNumber() @IsPositive() amount!: number;
  @IsOptional() @IsString() @MaxLength(50) referenceNo?: string;
  @IsOptional() @IsString() @MaxLength(500) note?: string;
}
