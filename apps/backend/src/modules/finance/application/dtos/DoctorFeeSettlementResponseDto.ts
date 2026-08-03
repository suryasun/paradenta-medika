export interface DoctorFeeSettlementItemResponseDto {
  id: string;
  visitTreatmentId: string;
  amount: number;
}

export interface DoctorFeeSettlementResponseDto {
  id: string;
  settlementNo: string;
  branchId: string;
  doctorId: string;
  periodStart: string;
  periodEnd: string;
  feeAccountId: string;
  grossAmount: number;
  deductions: number;
  netAmount: number;
  status: string;
  items: DoctorFeeSettlementItemResponseDto[];
  approvedBy: string | null;
  approvedAt: string | null;
  paidBy: string | null;
  paidAt: string | null;
  paymentJournalId: string | null;
  createdAt: string;
  createdBy: string | null;
}
