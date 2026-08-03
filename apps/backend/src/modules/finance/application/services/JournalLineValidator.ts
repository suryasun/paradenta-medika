import { JournalUnbalancedException } from '../../domain/exceptions/FinanceExceptions';
import { JournalLineEntryDto } from '../dtos/JournalRequestDto';

/**
 * docs/03-sad/17-module-finance.md Section 3.5 Posting Rules 1-3: at
 * least two non-zero lines, each line has either debit or credit (never
 * both, never neither), and SUM(debit) = SUM(credit). No literal Section
 * 6.6 code exists for "a line has both/neither debit and credit" --
 * folded into the same FIN_JOURNAL_UNBALANCED (422) response since both
 * violations mean the journal cannot be considered balanced.
 */
export function validateBalancedLines(lines: JournalLineEntryDto[]): void {
  for (const line of lines) {
    const hasDebit = line.debit > 0;
    const hasCredit = line.credit > 0;
    if (hasDebit === hasCredit) {
      throw new JournalUnbalancedException();
    }
  }

  const debitTotal = lines.reduce((sum, line) => sum + line.debit, 0);
  const creditTotal = lines.reduce((sum, line) => sum + line.credit, 0);
  if (Math.round(debitTotal * 100) !== Math.round(creditTotal * 100)) {
    throw new JournalUnbalancedException();
  }
}
