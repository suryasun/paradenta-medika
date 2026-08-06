import { Prisma, Treatment } from '@prisma/client';
import { prisma } from '../../../../shared/infrastructure/prisma';
import { ListQueryDto } from '../../../../shared/http/ListQueryDto';
import { PagedResult, sanitizeSortField } from '../../../../shared/http/pagination';
import { CreateTreatmentInput, ITreatmentRepository, UpdateTreatmentInput } from '../../domain/repositories/ITreatmentRepository';

const ALLOWED_SORT_FIELDS = ['createdAt', 'treatmentCode', 'treatmentName', 'defaultPrice'] as const;

function toCreateData(input: CreateTreatmentInput): Prisma.TreatmentCreateInput {
  return {
    treatmentCode: input.treatmentCode,
    treatmentName: input.treatmentName,
    treatmentCategory: { connect: { id: input.treatmentCategoryId } },
    durationMinute: input.durationMinute,
    defaultPrice: input.defaultPrice,
    doctorFee: input.doctorFee,
    // Phase 4 hardening: see the Treatment Prisma model's own comment.
    branch: input.branchId ? { connect: { id: input.branchId } } : undefined,
  };
}

function toUpdateData(input: UpdateTreatmentInput): Prisma.TreatmentUpdateInput {
  return {
    treatmentCode: input.treatmentCode,
    treatmentName: input.treatmentName,
    treatmentCategory: input.treatmentCategoryId ? { connect: { id: input.treatmentCategoryId } } : undefined,
    durationMinute: input.durationMinute,
    defaultPrice: input.defaultPrice,
    doctorFee: input.doctorFee,
    isActive: input.isActive,
  };
}

/**
 * docs/06-tasks/task-025.md: deactivation MUST be a soft `active=false`
 * flag, never a hard delete (`update` never performs a Prisma `delete`).
 */
export class TreatmentRepository implements ITreatmentRepository {
  async create(input: CreateTreatmentInput): Promise<Treatment> {
    return prisma.treatment.create({ data: toCreateData(input) });
  }

  async list(query: ListQueryDto): Promise<PagedResult<Treatment>> {
    const where: Prisma.TreatmentWhereInput = {
      deletedAt: null,
      ...(query.search
        ? { OR: [{ treatmentCode: { contains: query.search } }, { treatmentName: { contains: query.search } }] }
        : {}),
    };
    const [items, total] = await Promise.all([
      prisma.treatment.findMany({
        where,
        orderBy: { [sanitizeSortField(query.sort, ALLOWED_SORT_FIELDS)]: query.order },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      prisma.treatment.count({ where }),
    ]);
    return { items, total };
  }

  async findById(id: string): Promise<Treatment | null> {
    return prisma.treatment.findFirst({ where: { id, deletedAt: null } });
  }

  async findByCode(treatmentCode: string): Promise<Treatment | null> {
    return prisma.treatment.findFirst({ where: { treatmentCode, deletedAt: null } });
  }

  // Phase 4 hardening: branch-specific override first, else the clinic-wide
  // global row (branchId IS NULL) -- see the Treatment Prisma model's comment.
  async findByCodeForBranch(treatmentCode: string, branchId: string): Promise<Treatment | null> {
    const branchSpecific = await prisma.treatment.findFirst({ where: { treatmentCode, branchId, deletedAt: null } });
    if (branchSpecific) return branchSpecific;
    return prisma.treatment.findFirst({ where: { treatmentCode, branchId: null, deletedAt: null } });
  }

  async existsForBranch(treatmentCode: string, branchId: string | null): Promise<boolean> {
    const match = await prisma.treatment.findFirst({ where: { treatmentCode, branchId, deletedAt: null } });
    return match !== null;
  }

  async update(id: string, input: UpdateTreatmentInput): Promise<Treatment> {
    return prisma.treatment.update({ where: { id }, data: toUpdateData(input) });
  }
}
