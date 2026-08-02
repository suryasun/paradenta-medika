import { IsBoolean, IsEnum, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export enum AccountTypeDto {
  ASSET = 'asset',
  LIABILITY = 'liability',
  EQUITY = 'equity',
  REVENUE = 'revenue',
  EXPENSE = 'expense',
}

export enum NormalBalanceDto {
  DEBIT = 'debit',
  CREDIT = 'credit',
}

/** docs/03-sad/17-module-finance.md Section 6.1 literal Create Account example. */
export class CreateAccountRequestDto {
  @IsOptional() @IsUUID('4') branchId?: string;
  @IsString() @MinLength(1) @MaxLength(30) code!: string;
  @IsString() @MinLength(1) @MaxLength(150) name!: string;
  @IsEnum(AccountTypeDto) accountType!: AccountTypeDto;
  @IsEnum(NormalBalanceDto) normalBalance!: NormalBalanceDto;
  @IsOptional() @IsUUID('4') parentId?: string;
  @IsBoolean() isPostable!: boolean;
}

/** docs/06-tasks/task-145.md: name/accountType/normalBalance/parentId/isPostable are editable; code and branchId are not (natural key / ownership scope). */
export class UpdateAccountRequestDto {
  @IsOptional() @IsString() @MinLength(1) @MaxLength(150) name?: string;
  @IsOptional() @IsEnum(AccountTypeDto) accountType?: AccountTypeDto;
  @IsOptional() @IsEnum(NormalBalanceDto) normalBalance?: NormalBalanceDto;
  @IsOptional() @IsUUID('4') parentId?: string;
  @IsOptional() @IsBoolean() isPostable?: boolean;
}
