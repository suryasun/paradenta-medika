export interface DailyClosingResponseDto {
  id: string;
  branchId: string;
  cashAccountId: string;
  cashierId: string;
  closingDate: string;
  expectedBalance: number;
  countedBalance: number;
  variance: number;
  varianceReason: string | null;
  denominations: unknown;
  status: string;
  approvedBy: string | null;
  approvedAt: string | null;
  createdAt: string;
  createdBy: string | null;
}
