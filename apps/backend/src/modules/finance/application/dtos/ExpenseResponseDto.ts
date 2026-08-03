export interface ExpenseResponseDto {
  id: string;
  expenseNo: string;
  branchId: string;
  expenseDate: string;
  category: string;
  expenseAccountId: string;
  amount: number;
  approvedAmount: number | null;
  paidAmount: number | null;
  payeeName: string | null;
  description: string | null;
  evidenceUrl: string | null;
  status: string;
  submittedAt: string | null;
  approvedBy: string | null;
  approvedAt: string | null;
  rejectedBy: string | null;
  rejectedAt: string | null;
  rejectionReason: string | null;
  paidBy: string | null;
  paidAt: string | null;
  paymentJournalId: string | null;
  createdAt: string;
  createdBy: string | null;
}
