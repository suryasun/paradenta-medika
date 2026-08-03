export interface FinancialPeriodResponseDto {
  id: string;
  branchId: string;
  periodName: string;
  startDate: string;
  endDate: string;
  status: string;
  lockedBy: string | null;
  lockedAt: string | null;
  closedBy: string | null;
  closedAt: string | null;
  reopenedBy: string | null;
  reopenedAt: string | null;
  reopenReason: string | null;
  createdAt: string;
  createdBy: string | null;
}
