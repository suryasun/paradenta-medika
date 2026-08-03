import { ArrayMinSize, IsArray, IsDateString, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export interface JournalLineEntryDto {
  accountId: string;
  debit: number;
  credit: number;
  description?: string;
  costCenterId?: string;
}

/** docs/03-sad/17-module-finance.md Section 6.2 literal Create Manual Journal example. */
export class CreateJournalRequestDto {
  @IsUUID('4') branchId!: string;
  @IsDateString() journalDate!: string;
  @IsString() @MinLength(1) @MaxLength(500) description!: string;
  @IsArray() @ArrayMinSize(2) lines!: JournalLineEntryDto[];
}

/** docs/06-tasks/task-149.md AC: "Update rejected once journal is posted/reversed/voided (must be draft)." */
export class UpdateJournalRequestDto {
  @IsOptional() @IsDateString() journalDate?: string;
  @IsOptional() @IsString() @MinLength(1) @MaxLength(500) description?: string;
  @IsOptional() @IsArray() @ArrayMinSize(2) lines?: JournalLineEntryDto[];
}

/** docs/03-sad/17-module-finance.md Section 6.2: "Reversal request must contain journalDate and reason." */
export class ReverseJournalRequestDto {
  @IsDateString() journalDate!: string;
  @IsString() @MinLength(1) reason!: string;
}

export class VoidJournalRequestDto {
  @IsOptional() @IsString() @MaxLength(500) reason?: string;
}
