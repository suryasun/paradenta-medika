export interface JournalLineResponseDto {
  id: string;
  accountId: string;
  debit: number;
  credit: number;
  description: string | null;
  costCenterId: string | null;
}

export interface JournalResponseDto {
  id: string;
  journalNo: string | null;
  branchId: string;
  journalDate: string;
  referenceType: string | null;
  referenceId: string | null;
  postingType: string | null;
  description: string;
  status: string;
  lines: JournalLineResponseDto[];
  debitTotal: number;
  creditTotal: number;
  postedAt: string | null;
  postedBy: string | null;
  voidedAt: string | null;
  voidedBy: string | null;
  voidReason: string | null;
  reversalOfId: string | null;
  reverseReason: string | null;
  createdAt: string;
  createdBy: string | null;
}
