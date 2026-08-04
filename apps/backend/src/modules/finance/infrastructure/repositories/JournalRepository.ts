import { Journal, Prisma } from '@prisma/client';
import { prisma } from '../../../../shared/infrastructure/prisma';
import { ListQueryDto } from '../../../../shared/http/ListQueryDto';
import { PagedResult, sanitizeSortField } from '../../../../shared/http/pagination';
import {
  CreateJournalInput,
  CreatePostedJournalInput,
  IJournalRepository,
  JournalListFilter,
  JournalWithLines,
  PostedJournalLine,
  ReplaceJournalLinesInput,
} from '../../domain/repositories/IJournalRepository';

const ALLOWED_SORT_FIELDS = ['createdAt', 'journalDate', 'journalNo'] as const;
const INCLUDE = { lines: true } as const;

export class JournalRepository implements IJournalRepository {
  async create(input: CreateJournalInput): Promise<JournalWithLines> {
    return prisma.journal.create({
      data: {
        branchId: input.branchId,
        journalDate: input.journalDate,
        description: input.description,
        referenceType: input.referenceType,
        referenceId: input.referenceId,
        postingType: input.postingType,
        createdBy: input.createdBy,
        lines: {
          create: input.lines.map((line) => ({
            accountId: line.accountId,
            debit: line.debit,
            credit: line.credit,
            description: line.description,
            costCenterId: line.costCenterId,
          })),
        },
      },
      include: INCLUDE,
    });
  }

  async list(query: ListQueryDto, filter: JournalListFilter): Promise<PagedResult<JournalWithLines>> {
    const where: Prisma.JournalWhereInput = {
      branchId: filter.branchId,
      status: filter.status,
      journalDate: filter.dateFrom || filter.dateTo ? { gte: filter.dateFrom, lte: filter.dateTo } : undefined,
      lines: filter.accountId ? { some: { accountId: filter.accountId } } : undefined,
    };
    const [items, total] = await Promise.all([
      prisma.journal.findMany({
        where,
        include: INCLUDE,
        orderBy: { [sanitizeSortField(query.sort, ALLOWED_SORT_FIELDS)]: query.order },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      prisma.journal.count({ where }),
    ]);
    return { items, total };
  }

  async findById(id: string): Promise<JournalWithLines | null> {
    return prisma.journal.findUnique({ where: { id }, include: INCLUDE });
  }

  async findByReference(referenceType: string, referenceId: string, postingType: string): Promise<Journal | null> {
    return prisma.journal.findUnique({
      where: { idempotency_key: { referenceType, referenceId, postingType } },
    });
  }

  async replaceLines(id: string, input: ReplaceJournalLinesInput): Promise<JournalWithLines> {
    return prisma.$transaction(async (tx) => {
      if (input.lines) {
        await tx.journalLine.deleteMany({ where: { journalId: id } });
        await tx.journalLine.createMany({
          data: input.lines.map((line) => ({
            journalId: id,
            accountId: line.accountId,
            debit: line.debit,
            credit: line.credit,
            description: line.description,
            costCenterId: line.costCenterId,
          })),
        });
      }

      return tx.journal.update({
        where: { id },
        data: { journalDate: input.journalDate, description: input.description, updatedBy: input.updatedBy },
        include: INCLUDE,
      });
    });
  }

  async markPosted(id: string, journalNo: string, postedBy: string, postedAt: Date): Promise<JournalWithLines> {
    return prisma.journal.update({
      where: { id },
      data: { status: 'POSTED', journalNo, postedBy, postedAt, updatedBy: postedBy },
      include: INCLUDE,
    });
  }

  async markVoided(id: string, voidedBy: string, voidedAt: Date, voidReason?: string): Promise<JournalWithLines> {
    return prisma.journal.update({
      where: { id },
      data: { status: 'VOIDED', voidedBy, voidedAt, voidReason, updatedBy: voidedBy },
      include: INCLUDE,
    });
  }

  async createReversal(
    original: JournalWithLines,
    input: { journalNo: string; journalDate: Date; reason: string; actorUserId: string },
  ): Promise<JournalWithLines> {
    return prisma.$transaction(async (tx) => {
      const reversal = await tx.journal.create({
        data: {
          journalNo: input.journalNo,
          branchId: original.branchId,
          journalDate: input.journalDate,
          description: `Reversal of ${original.journalNo ?? original.id}: ${input.reason}`,
          status: 'POSTED',
          postedAt: new Date(),
          postedBy: input.actorUserId,
          reversalOfId: original.id,
          reverseReason: input.reason,
          createdBy: input.actorUserId,
          lines: {
            create: original.lines.map((line) => ({
              accountId: line.accountId,
              debit: line.credit,
              credit: line.debit,
              description: line.description,
              costCenterId: line.costCenterId,
            })),
          },
        },
        include: INCLUDE,
      });

      await tx.journal.update({
        where: { id: original.id },
        data: { status: 'REVERSED', updatedBy: input.actorUserId },
      });

      return reversal;
    });
  }

  async createPosted(input: CreatePostedJournalInput): Promise<JournalWithLines> {
    return prisma.journal.create({
      data: {
        journalNo: input.journalNo,
        branchId: input.branchId,
        journalDate: input.journalDate,
        description: input.description,
        referenceType: input.referenceType,
        referenceId: input.referenceId,
        postingType: input.postingType,
        status: 'POSTED',
        postedAt: new Date(),
        postedBy: input.postedBy,
        createdBy: input.createdBy,
        lines: {
          create: input.lines.map((line) => ({
            accountId: line.accountId,
            debit: line.debit,
            credit: line.credit,
            description: line.description,
            costCenterId: line.costCenterId,
          })),
        },
      },
      include: INCLUDE,
    });
  }

  async listPostedLinesByAccount(accountId: string, query: ListQueryDto): Promise<PagedResult<PostedJournalLine>> {
    const where: Prisma.JournalLineWhereInput = { accountId, journal: { status: 'POSTED' } };
    const [rows, total] = await Promise.all([
      prisma.journalLine.findMany({
        where,
        include: { journal: true },
        orderBy: { journal: { journalDate: 'desc' } },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      prisma.journalLine.count({ where }),
    ]);
    const items: PostedJournalLine[] = rows.map((line) => ({
      journalId: line.journal.id,
      journalNo: line.journal.journalNo ?? '',
      journalDate: line.journal.journalDate,
      debit: Number(line.debit),
      credit: Number(line.credit),
      description: line.description,
    }));
    return { items, total };
  }

  async count(): Promise<number> {
    return prisma.journal.count();
  }

  async findByNumber(journalNo: string): Promise<Journal | null> {
    return prisma.journal.findUnique({ where: { journalNo } });
  }

  async countOpenByBranch(branchId: string): Promise<number> {
    return prisma.journal.count({ where: { branchId, status: 'DRAFT' } });
  }
}
