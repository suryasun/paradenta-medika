import { FinancialPeriod } from '@prisma/client';
import { FinancialPeriodResponseDto } from '../dtos/FinancialPeriodResponseDto';

export function toFinancialPeriodResponseDto(period: FinancialPeriod): FinancialPeriodResponseDto {
  return {
    id: period.id,
    branchId: period.branchId,
    periodName: period.periodName,
    startDate: period.startDate.toISOString(),
    endDate: period.endDate.toISOString(),
    status: period.status,
    lockedBy: period.lockedBy,
    lockedAt: period.lockedAt ? period.lockedAt.toISOString() : null,
    closedBy: period.closedBy,
    closedAt: period.closedAt ? period.closedAt.toISOString() : null,
    reopenedBy: period.reopenedBy,
    reopenedAt: period.reopenedAt ? period.reopenedAt.toISOString() : null,
    reopenReason: period.reopenReason,
    createdAt: period.createdAt.toISOString(),
    createdBy: period.createdBy,
  };
}
