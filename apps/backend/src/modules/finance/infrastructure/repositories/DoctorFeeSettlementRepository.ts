import { DoctorFeeSettlement, Prisma } from '@prisma/client';
import { prisma } from '../../../../shared/infrastructure/prisma';
import { ListQueryDto } from '../../../../shared/http/ListQueryDto';
import { PagedResult, sanitizeSortField } from '../../../../shared/http/pagination';
import {
  CreateDoctorFeeSettlementInput,
  DoctorFeeSettlementListFilter,
  DoctorFeeSettlementWithItems,
  IDoctorFeeSettlementRepository,
} from '../../domain/repositories/IDoctorFeeSettlementRepository';

const ALLOWED_SORT_FIELDS = ['createdAt', 'settlementNo'] as const;
const INCLUDE = { items: true } as const;

export class DoctorFeeSettlementRepository implements IDoctorFeeSettlementRepository {
  async create(input: CreateDoctorFeeSettlementInput): Promise<DoctorFeeSettlementWithItems> {
    return prisma.doctorFeeSettlement.create({
      data: {
        settlementNo: input.settlementNo,
        branchId: input.branchId,
        doctorId: input.doctorId,
        periodStart: input.periodStart,
        periodEnd: input.periodEnd,
        feeAccountId: input.feeAccountId,
        grossAmount: input.grossAmount,
        netAmount: input.netAmount,
        createdBy: input.createdBy,
        items: {
          create: input.items.map((item) => ({ visitTreatmentId: item.visitTreatmentId, amount: item.amount })),
        },
      },
      include: INCLUDE,
    });
  }

  async list(query: ListQueryDto, filter: DoctorFeeSettlementListFilter): Promise<PagedResult<DoctorFeeSettlementWithItems>> {
    const where: Prisma.DoctorFeeSettlementWhereInput = {
      branchId: filter.branchId,
      doctorId: filter.doctorId,
      status: filter.status,
    };
    const [items, total] = await Promise.all([
      prisma.doctorFeeSettlement.findMany({
        where,
        include: INCLUDE,
        orderBy: { [sanitizeSortField(query.sort, ALLOWED_SORT_FIELDS)]: query.order },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      prisma.doctorFeeSettlement.count({ where }),
    ]);
    return { items, total };
  }

  async findById(id: string): Promise<DoctorFeeSettlementWithItems | null> {
    return prisma.doctorFeeSettlement.findUnique({ where: { id }, include: INCLUDE });
  }

  async findSettledVisitTreatmentIds(doctorId: string): Promise<string[]> {
    const rows = await prisma.doctorFeeSettlementItem.findMany({
      where: { settlement: { doctorId } },
      select: { visitTreatmentId: true },
    });
    return rows.map((r) => r.visitTreatmentId);
  }

  async approve(id: string, approvedBy: string, approvedAt: Date): Promise<DoctorFeeSettlementWithItems> {
    return prisma.doctorFeeSettlement.update({
      where: { id },
      data: { status: 'APPROVED', approvedBy, approvedAt, updatedBy: approvedBy },
      include: INCLUDE,
    });
  }

  async markPaid(id: string, paidBy: string, paidAt: Date, paymentJournalId: string): Promise<DoctorFeeSettlementWithItems> {
    return prisma.doctorFeeSettlement.update({
      where: { id },
      data: { status: 'PAID', paidBy, paidAt, paymentJournalId, updatedBy: paidBy },
      include: INCLUDE,
    });
  }

  async count(): Promise<number> {
    return prisma.doctorFeeSettlement.count();
  }

  async findByNumber(settlementNo: string): Promise<DoctorFeeSettlement | null> {
    return prisma.doctorFeeSettlement.findUnique({ where: { settlementNo } });
  }
}
