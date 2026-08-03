export interface FinanceAccountMappingResponseDto {
  id: string;
  branchId: string;
  paymentMethodId: string;
  cashAccountId: string;
  revenueAccountId: string;
  isActive: boolean;
  createdAt: string;
  createdBy: string | null;
}
