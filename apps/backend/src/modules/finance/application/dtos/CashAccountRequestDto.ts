import { IsEnum, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export enum CashAccountTypeDto {
  CASH = 'cash',
  BANK = 'bank',
  CLEARING = 'clearing',
}

export class CreateCashAccountRequestDto {
  @IsUUID('4') branchId!: string;
  @IsString() @MinLength(1) @MaxLength(30) code!: string;
  @IsString() @MinLength(1) @MaxLength(150) name!: string;
  @IsEnum(CashAccountTypeDto) accountType!: CashAccountTypeDto;
  @IsUUID('4') ledgerAccountId!: string;
  @IsOptional() @IsString() @MaxLength(100) accountNumber?: string;
}
