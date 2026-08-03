import { FinanceAccountMapping } from '@prisma/client';
import { FinanceAccountMappingResponseDto } from '../dtos/FinanceAccountMappingResponseDto';

export function toFinanceAccountMappingResponseDto(mapping: FinanceAccountMapping): FinanceAccountMappingResponseDto {
  return {
    id: mapping.id,
    branchId: mapping.branchId,
    paymentMethodId: mapping.paymentMethodId,
    cashAccountId: mapping.cashAccountId,
    revenueAccountId: mapping.revenueAccountId,
    isActive: mapping.isActive,
    createdAt: mapping.createdAt.toISOString(),
    createdBy: mapping.createdBy,
  };
}
