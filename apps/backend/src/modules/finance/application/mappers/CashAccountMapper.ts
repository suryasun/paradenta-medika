import { CashAccount } from '@prisma/client';
import { PostedJournalLine } from '../../domain/repositories/IJournalRepository';
import { CashAccountResponseDto } from '../dtos/CashAccountResponseDto';
import { CashAccountMovementResponseDto } from '../dtos/CashAccountMovementResponseDto';

export function toCashAccountResponseDto(cashAccount: CashAccount): CashAccountResponseDto {
  return {
    id: cashAccount.id,
    branchId: cashAccount.branchId,
    code: cashAccount.code,
    name: cashAccount.name,
    accountType: cashAccount.accountType.toLowerCase(),
    ledgerAccountId: cashAccount.ledgerAccountId,
    accountNumber: cashAccount.accountNumber,
    currentBalance: Number(cashAccount.currentBalance),
    isActive: cashAccount.isActive,
    createdAt: cashAccount.createdAt.toISOString(),
    createdBy: cashAccount.createdBy,
  };
}

export function toCashAccountMovementResponseDto(line: PostedJournalLine): CashAccountMovementResponseDto {
  return {
    journalId: line.journalId,
    journalNo: line.journalNo,
    journalDate: line.journalDate.toISOString(),
    debit: line.debit,
    credit: line.credit,
    description: line.description,
  };
}
