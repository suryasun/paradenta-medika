import { Journal, JournalLine, FinanceJournalStatus } from '@prisma/client';
import { ListQueryDto } from '../../../../shared/http/ListQueryDto';
import { PagedResult } from '../../../../shared/http/pagination';

export type JournalWithLines = Journal & { lines: JournalLine[] };

export interface CreateJournalLineInput {
  accountId: string;
  debit: number;
  credit: number;
  description?: string;
  costCenterId?: string;
}

export interface CreateJournalInput {
  branchId: string;
  journalDate: Date;
  description: string;
  referenceType?: string;
  referenceId?: string;
  postingType?: string;
  lines: CreateJournalLineInput[];
  createdBy: string;
}

export interface ReplaceJournalLinesInput {
  journalDate?: Date;
  description?: string;
  lines?: CreateJournalLineInput[];
  updatedBy: string;
}

export interface JournalListFilter {
  branchId?: string;
  status?: FinanceJournalStatus;
  dateFrom?: Date;
  dateTo?: Date;
  accountId?: string;
}

export interface CreatePostedJournalInput extends CreateJournalInput {
  journalNo: string;
  postedBy: string;
}

export interface PostedJournalLine {
  journalId: string;
  journalNo: string;
  journalDate: Date;
  debit: number;
  credit: number;
  description: string | null;
}

export interface IJournalRepository {
  create(input: CreateJournalInput): Promise<JournalWithLines>;
  list(query: ListQueryDto, filter: JournalListFilter): Promise<PagedResult<JournalWithLines>>;
  findById(id: string): Promise<JournalWithLines | null>;
  findByReference(referenceType: string, referenceId: string, postingType: string): Promise<Journal | null>;
  replaceLines(id: string, input: ReplaceJournalLinesInput): Promise<JournalWithLines>;
  markPosted(id: string, journalNo: string, postedBy: string, postedAt: Date): Promise<JournalWithLines>;
  markVoided(id: string, voidedBy: string, voidedAt: Date, voidReason?: string): Promise<JournalWithLines>;
  /** Creates the linked reversal journal (already posted) and marks the original's reversedBy link atomically. */
  createReversal(
    original: JournalWithLines,
    input: { journalNo: string; journalDate: Date; reason: string; actorUserId: string },
  ): Promise<JournalWithLines>;
  /**
   * Creates a journal that is already `POSTED`, for system-generated
   * postings (Cash Transfer, Expense Payment) -- `createdBy` stays the
   * originating human actor for audit, while `postedBy` is a `system:*`
   * sentinel, so `PostJournalUseCase`'s maker-checker guard (creator !=
   * poster) never applies to these, per Section 8.2: "System-generated
   * journals are posted by service identity, but the originating user
   * and source event remain audit fields."
   */
  createPosted(input: CreatePostedJournalInput): Promise<JournalWithLines>;
  /** Posted journal lines against a given account, most recent first -- backs Cash Account Movements (task-154). */
  listPostedLinesByAccount(accountId: string, query: ListQueryDto): Promise<PagedResult<PostedJournalLine>>;
  count(): Promise<number>;
  findByNumber(journalNo: string): Promise<Journal | null>;
}
