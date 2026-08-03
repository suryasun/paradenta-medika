export interface CashAccountMovementResponseDto {
  journalId: string;
  journalNo: string;
  journalDate: string;
  debit: number;
  credit: number;
  description: string | null;
}
