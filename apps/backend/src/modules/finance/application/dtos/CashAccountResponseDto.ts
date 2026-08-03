export interface CashAccountResponseDto {
  id: string;
  branchId: string;
  code: string;
  name: string;
  accountType: string;
  ledgerAccountId: string;
  accountNumber: string | null;
  currentBalance: number;
  isActive: boolean;
  createdAt: string;
  createdBy: string | null;
}
