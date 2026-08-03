import { DailyClosing } from '@prisma/client';
import { DailyClosingResponseDto } from '../dtos/DailyClosingResponseDto';

export function toDailyClosingResponseDto(closing: DailyClosing): DailyClosingResponseDto {
  return {
    id: closing.id,
    branchId: closing.branchId,
    cashAccountId: closing.cashAccountId,
    cashierId: closing.cashierId,
    closingDate: closing.closingDate.toISOString(),
    expectedBalance: Number(closing.expectedBalance),
    countedBalance: Number(closing.countedBalance),
    variance: Number(closing.variance),
    varianceReason: closing.varianceReason,
    denominations: closing.denominations,
    status: closing.status,
    approvedBy: closing.approvedBy,
    approvedAt: closing.approvedAt ? closing.approvedAt.toISOString() : null,
    createdAt: closing.createdAt.toISOString(),
    createdBy: closing.createdBy,
  };
}
