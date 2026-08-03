import { DoctorFeeSettlement, DoctorFeeSettlementItem, DoctorFeeSettlementStatus } from '@prisma/client';
import { ListQueryDto } from '../../../../shared/http/ListQueryDto';
import { PagedResult } from '../../../../shared/http/pagination';

export type DoctorFeeSettlementWithItems = DoctorFeeSettlement & { items: DoctorFeeSettlementItem[] };

export interface CreateDoctorFeeSettlementItemInput {
  visitTreatmentId: string;
  amount: number;
}

export interface CreateDoctorFeeSettlementInput {
  settlementNo: string;
  branchId: string;
  doctorId: string;
  periodStart: Date;
  periodEnd: Date;
  feeAccountId: string;
  grossAmount: number;
  netAmount: number;
  items: CreateDoctorFeeSettlementItemInput[];
  createdBy: string;
}

export interface DoctorFeeSettlementListFilter {
  branchId?: string;
  doctorId?: string;
  status?: DoctorFeeSettlementStatus;
}

export interface IDoctorFeeSettlementRepository {
  create(input: CreateDoctorFeeSettlementInput): Promise<DoctorFeeSettlementWithItems>;
  list(query: ListQueryDto, filter: DoctorFeeSettlementListFilter): Promise<PagedResult<DoctorFeeSettlementWithItems>>;
  findById(id: string): Promise<DoctorFeeSettlementWithItems | null>;
  findSettledVisitTreatmentIds(doctorId: string): Promise<string[]>;
  approve(id: string, approvedBy: string, approvedAt: Date): Promise<DoctorFeeSettlementWithItems>;
  markPaid(id: string, paidBy: string, paidAt: Date, paymentJournalId: string): Promise<DoctorFeeSettlementWithItems>;
  count(): Promise<number>;
  findByNumber(settlementNo: string): Promise<DoctorFeeSettlement | null>;
}
