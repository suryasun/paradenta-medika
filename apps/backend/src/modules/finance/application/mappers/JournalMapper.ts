import { JournalLine } from '@prisma/client';
import { JournalWithLines } from '../../domain/repositories/IJournalRepository';
import { JournalLineResponseDto, JournalResponseDto } from '../dtos/JournalResponseDto';

function toLineDto(line: JournalLine): JournalLineResponseDto {
  return {
    id: line.id,
    accountId: line.accountId,
    debit: Number(line.debit),
    credit: Number(line.credit),
    description: line.description,
    costCenterId: line.costCenterId,
  };
}

export function toJournalResponseDto(journal: JournalWithLines): JournalResponseDto {
  const debitTotal = journal.lines.reduce((sum, line) => sum + Number(line.debit), 0);
  const creditTotal = journal.lines.reduce((sum, line) => sum + Number(line.credit), 0);

  return {
    id: journal.id,
    journalNo: journal.journalNo,
    branchId: journal.branchId,
    journalDate: journal.journalDate.toISOString(),
    referenceType: journal.referenceType,
    referenceId: journal.referenceId,
    postingType: journal.postingType,
    description: journal.description,
    status: journal.status,
    lines: journal.lines.map(toLineDto),
    debitTotal,
    creditTotal,
    postedAt: journal.postedAt ? journal.postedAt.toISOString() : null,
    postedBy: journal.postedBy,
    voidedAt: journal.voidedAt ? journal.voidedAt.toISOString() : null,
    voidedBy: journal.voidedBy,
    voidReason: journal.voidReason,
    reversalOfId: journal.reversalOfId,
    reverseReason: journal.reverseReason,
    createdAt: journal.createdAt.toISOString(),
    createdBy: journal.createdBy,
  };
}
