import { Prisma, Queue, QueueStatus, QueueType, QueuePriority } from '@prisma/client';
import { prisma } from '../../../../shared/infrastructure/prisma';
import { PagedResult, sanitizeSortField } from '../../../../shared/http/pagination';
import { CreateQueueInput, IQueueRepository, QueueDashboardScope, QueueListFilters, QueueWithOptionalPatient } from '../../domain/repositories/IQueueRepository';

const ALLOWED_SORT_FIELDS = ['createdAt', 'queueNumber', 'checkedInAt'] as const;

const TIMESTAMP_FIELD_MAP: Record<string, 'calledAt' | 'startedAt' | 'completedAt' | 'cancelledAt'> = {
  calledAt: 'calledAt',
  startedAt: 'startedAt',
  completedAt: 'completedAt',
  cancelledAt: 'cancelledAt',
};

export class QueueRepository implements IQueueRepository {
  async create(input: CreateQueueInput): Promise<Queue> {
    return prisma.queue.create({
      data: {
        reservationId: input.reservationId,
        branchId: input.branchId,
        patientId: input.patientId,
        doctorId: input.doctorId,
        queueNumber: input.queueNumber,
        queuePrefix: input.queuePrefix,
        queueDate: input.queueDate,
        queueType: input.queueType as QueueType,
        priority: (input.priority ?? 'NORMAL') as QueuePriority,
        createdBy: input.createdBy,
      },
    });
  }

  async findById(id: string): Promise<QueueWithOptionalPatient | null> {
    return prisma.queue.findFirst({
      where: { id, deletedAt: null },
      include: { patient: { select: { medicalRecordNo: true, patientName: true } }, visit: { select: { id: true } } },
    });
  }

  async findByReservationId(reservationId: string): Promise<Queue | null> {
    return prisma.queue.findFirst({ where: { reservationId, deletedAt: null } });
  }

  async search(filters: QueueListFilters): Promise<PagedResult<QueueWithOptionalPatient>> {
    // docs/06-tasks/task-311.md/task-312.md: branchId/doctorId (explicit,
    // client-supplied) and allowedBranchIds/restrictToDoctorId (server-
    // computed scope) are combined with AND, not object-key overwrite --
    // an explicit filter narrower than or outside the resolved scope must
    // still be respected/rejected, never silently widen the caller's access.
    const scopedConditions: Prisma.QueueWhereInput[] = [];
    if (filters.branchId) scopedConditions.push({ branchId: filters.branchId });
    if (filters.allowedBranchIds) scopedConditions.push({ branchId: { in: filters.allowedBranchIds } });
    if (filters.doctorId) scopedConditions.push({ doctorId: filters.doctorId });
    if (filters.restrictToDoctorId) scopedConditions.push({ doctorId: filters.restrictToDoctorId });

    const where: Prisma.QueueWhereInput = {
      deletedAt: null,
      ...(filters.status ? { status: filters.status as QueueStatus } : {}),
      ...(filters.visitDate ? { queueDate: new Date(`${filters.visitDate}T00:00:00.000Z`) } : {}),
      ...(scopedConditions.length > 0 ? { AND: scopedConditions } : {}),
    };

    const [items, total] = await Promise.all([
      prisma.queue.findMany({
        where,
        orderBy: { [sanitizeSortField(filters.sort, ALLOWED_SORT_FIELDS)]: filters.order },
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit,
        include: { patient: { select: { medicalRecordNo: true, patientName: true } }, visit: { select: { id: true } } },
      }),
      prisma.queue.count({ where }),
    ]);

    return { items, total };
  }

  async countActiveForPatientOnDate(patientId: string, branchId: string, date: Date): Promise<number> {
    return prisma.queue.count({
      where: {
        patientId,
        branchId,
        queueDate: date,
        status: { in: ['WAITING', 'CALLED', 'IN_SERVICE'] },
        deletedAt: null,
      },
    });
  }

  async countLastQueueNumber(branchId: string, date: Date): Promise<number> {
    return prisma.queue.count({ where: { branchId, queueDate: date } });
  }

  async updateStatus(
    id: string,
    status: string,
    timestampField: 'calledAt' | 'startedAt' | 'completedAt' | 'cancelledAt' | null,
    updatedBy: string,
  ): Promise<Queue> {
    const data: Prisma.QueueUpdateInput = { status: status as QueueStatus, updatedBy };
    if (timestampField) {
      const field = TIMESTAMP_FIELD_MAP[timestampField];
      data[field] = new Date();
    }
    return prisma.queue.update({ where: { id }, data });
  }

  async updateDoctor(id: string, doctorId: string, updatedBy: string): Promise<Queue> {
    return prisma.queue.update({ where: { id }, data: { doctorId, updatedBy } });
  }

  /** docs/06-tasks/task-311.md/task-312.md: shared AND-combination of the
   * dashboard's explicit branchId param with the resolved branch/doctor
   * scope, same rationale as search()'s scopedConditions above. */
  private buildScopeWhere(scope: QueueDashboardScope): Prisma.QueueWhereInput {
    const conditions: Prisma.QueueWhereInput[] = [];
    if (scope.branchId) conditions.push({ branchId: scope.branchId });
    if (scope.allowedBranchIds) conditions.push({ branchId: { in: scope.allowedBranchIds } });
    if (scope.restrictToDoctorId) conditions.push({ doctorId: scope.restrictToDoctorId });
    return conditions.length > 0 ? { AND: conditions } : {};
  }

  async countByStatus(scope: QueueDashboardScope, date?: Date): Promise<Record<string, number>> {
    const where: Prisma.QueueWhereInput = {
      deletedAt: null,
      ...(date ? { queueDate: date } : {}),
      ...this.buildScopeWhere(scope),
    };
    const grouped = await prisma.queue.groupBy({ by: ['status'], where, _count: { _all: true } });
    const result: Record<string, number> = {};
    for (const row of grouped) {
      result[row.status] = row._count._all;
    }
    return result;
  }

  async countByDoctor(scope: QueueDashboardScope, date?: Date): Promise<Array<{ doctorId: string; count: number }>> {
    const where: Prisma.QueueWhereInput = {
      deletedAt: null,
      ...(date ? { queueDate: date } : {}),
      ...this.buildScopeWhere(scope),
    };
    const grouped = await prisma.queue.groupBy({ by: ['doctorId'], where, _count: { _all: true } });
    return grouped.map((row) => ({ doctorId: row.doctorId, count: row._count._all }));
  }

  async findCompletedForMetrics(scope: QueueDashboardScope, date?: Date): Promise<Queue[]> {
    return prisma.queue.findMany({
      where: {
        deletedAt: null,
        status: 'COMPLETED',
        ...(date ? { queueDate: date } : {}),
        ...this.buildScopeWhere(scope),
      },
    });
  }

  async countOpenByBranch(branchId: string): Promise<number> {
    return prisma.queue.count({
      where: {
        branchId,
        deletedAt: null,
        status: { notIn: ['COMPLETED', 'CANCELLED', 'NO_SHOW', 'SKIPPED'] },
      },
    });
  }
}
