import { IsDateString, IsNumber, IsOptional, IsPositive, IsString, IsUUID, MaxLength } from 'class-validator';

/**
 * docs/03-sad/17-module-finance.md UC-FIN-004: no literal request-body
 * example given (unlike Pay Expense); shaped consistently with Journal's
 * own date/description fields. No `branchId` field -- Section 8.3:
 * "Client-provided branchId is a filter/request, not an authority
 * grant"; the journal's branch is derived server-side from the source
 * cash account.
 */
export class CreateCashTransferRequestDto {
  @IsDateString() transferDate!: string;
  @IsUUID('4') sourceCashAccountId!: string;
  @IsUUID('4') destinationCashAccountId!: string;
  @IsNumber() @IsPositive() amount!: number;
  @IsOptional() @IsString() @MaxLength(500) description?: string;
}
