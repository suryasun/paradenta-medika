import { Prisma, Queue, QueueStatus, QueueType, QueuePriority } from '@prisma/client';
import { prisma } from '../../../../shared/infrastructure/prisma';
import { PagedResult, sanitizeSortField } from '../../../../shared/http/pagination';
import { CreateQueueInput, IQueueRepository, QueueListFilters } from '../../domain/repositories/IQueueRepository';

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

  async findById(id: string): Promise<Queue | null> {
    return prisma.queue.findFirst({ where: { id, deletedAt: null } });
  }

  async findByReservationId(reservationId: string): Promise<Queue | null> {
    return prisma.queue.findFirst({ where: { reservationId, deletedAt: null } });
  }

  async search(filters: QueueListFilters): Promise<PagedResult<Queue>> {
    const where: Prisma.QueueWhereInput = {
      deletedAt: null,
      ...(filters.status ? { status: filters.status as QueueStatus } : {}),
      ...(filters.doctorId ? { doctorId: filters.doctorId } : {}),
      ...(filters.branchId ? { branchId: filters.branchId } : {}),
      ...(filters.visitDate ? { queueDate: new Date(`${filters.visitDate}T00:00:00.000Z`) } : {}),
    };

    const [items, total] = await Promise.all([
      prisma.queue.findMany({
        where,
        orderBy: { [sanitizeSortField(filters.sort, ALLOWED_SORT_FIELDS)]: filters.order },
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit,
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

  async countByStatus(branchId?: string, date?: Date): Promise<Record<string, number>> {
    const where: Prisma.QueueWhereInput = {
      deletedAt: null,
      ...(branchId ? { branchId } : {}),
      ...(date ? { queueDate: date } : {}),
    };
    const grouped = await prisma.queue.groupBy({ by: ['status'], where, _count: { _all: true } });
    const result: Record<string, number> = {};
    for (const row of grouped) {
      result[row.status] = row._count._all;
    }
    return result;
  }

  async countByDoctor(branchId?: string, date?: Date): Promise<Array<{ doctorId: string; count: number }>> {
    const where: Prisma.QueueWhereInput = {
      deletedAt: null,
      ...(branchId ? { branchId } : {}),
      ...(date ? { queueDate: date } : {}),
    };
    const grouped = await prisma.queue.groupBy({ by: ['doctorId'], where, _count: { _all: true } });
    return grouped.map((row) => ({ doctorId: row.doctorId, count: row._count._all }));
  }

  async findCompletedForMetrics(branchId?: string, date?: Date): Promise<Queue[]> {
    return prisma.queue.findMany({
      where: {
        deletedAt: null,
        status: 'COMPLETED',
        ...(branchId ? { branchId } : {}),
        ...(date ? { queueDate: date } : {}),
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
