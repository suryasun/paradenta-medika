import { DoctorFeeSettlementItem } from '@prisma/client';
import { DoctorFeeSettlementWithItems } from '../../domain/repositories/IDoctorFeeSettlementRepository';
import { DoctorFeeSettlementItemResponseDto, DoctorFeeSettlementResponseDto } from '../dtos/DoctorFeeSettlementResponseDto';

function toItemDto(item: DoctorFeeSettlementItem): DoctorFeeSettlementItemResponseDto {
  return { id: item.id, visitTreatmentId: item.visitTreatmentId, amount: Number(item.amount) };
}

export function toDoctorFeeSettlementResponseDto(settlement: DoctorFeeSettlementWithItems): DoctorFeeSettlementResponseDto {
  return {
    id: settlement.id,
    settlementNo: settlement.settlementNo,
    branchId: settlement.branchId,
    doctorId: settlement.doctorId,
    periodStart: settlement.periodStart.toISOString(),
    periodEnd: settlement.periodEnd.toISOString(),
    feeAccountId: settlement.feeAccountId,
    grossAmount: Number(settlement.grossAmount),
    deductions: Number(settlement.deductions),
    netAmount: Number(settlement.netAmount),
    status: settlement.status,
    items: settlement.items.map(toItemDto),
    approvedBy: settlement.approvedBy,
    approvedAt: settlement.approvedAt ? settlement.approvedAt.toISOString() : null,
    paidBy: settlement.paidBy,
    paidAt: settlement.paidAt ? settlement.paidAt.toISOString() : null,
    paymentJournalId: settlement.paymentJournalId,
    createdAt: settlement.createdAt.toISOString(),
    createdBy: settlement.createdBy,
  };
}
