import { Queue, QueueCall } from '@prisma/client';
import { CreateQueueInput, IQueueRepository, QueueDashboardScope, QueueListFilters } from '../../src/modules/queue/domain/repositories/IQueueRepository';
import { AppendQueueHistoryInput, IQueueHistoryRepository } from '../../src/modules/queue/domain/repositories/IQueueHistoryRepository';
import { IQueueCallRepository } from '../../src/modules/queue/domain/repositories/IQueueCallRepository';
import { PagedResult } from '../../src/shared/http/pagination';
import { nextFakeUuid } from './uuid';

export class FakeQueueRepository implements IQueueRepository {
  queues = new Map<string, Queue>();

  async create(input: CreateQueueInput): Promise<Queue> {
    const queue: Queue = {
      id: nextFakeUuid(),
      reservationId: input.reservationId ?? null,
      branchId: input.branchId,
      patientId: input.patientId,
      doctorId: input.doctorId,
      queueNumber: input.queueNumber,
      queuePrefix: input.queuePrefix,
      queueDate: input.queueDate,
      queueType: input.queueType,
      priority: input.priority ?? 'NORMAL',
      status: 'WAITING',
      currentPosition: null,
      estimatedCallTime: null,
      checkedInAt: new Date(),
      calledAt: null,
      startedAt: null,
      completedAt: null,
      cancelledAt: null,
      notes: null,
      createdAt: new Date(),
      createdBy: input.createdBy,
      updatedAt: new Date(),
      updatedBy: null,
      deletedAt: null,
      deletedBy: null,
    } as Queue;
    this.queues.set(queue.id, queue);
    return queue;
  }

  async findById(id: string): Promise<Queue | null> {
    return this.queues.get(id) ?? null;
  }

  async findByReservationId(reservationId: string): Promise<Queue | null> {
    return [...this.queues.values()].find((q) => q.reservationId === reservationId) ?? null;
  }

  async search(filters: QueueListFilters): Promise<PagedResult<Queue>> {
    let all = [...this.queues.values()];
    if (filters.status) all = all.filter((q) => q.status === filters.status);
    if (filters.doctorId) all = all.filter((q) => q.doctorId === filters.doctorId);
    if (filters.branchId) all = all.filter((q) => q.branchId === filters.branchId);
    if (filters.allowedBranchIds) all = all.filter((q) => filters.allowedBranchIds!.includes(q.branchId));
    if (filters.restrictToDoctorId) all = all.filter((q) => q.doctorId === filters.restrictToDoctorId);
    const start = (filters.page - 1) * filters.limit;
    return { items: all.slice(start, start + filters.limit), total: all.length };
  }

  async countActiveForPatientOnDate(patientId: string, branchId: string, date: Date): Promise<number> {
    return [...this.queues.values()].filter(
      (q) =>
        q.patientId === patientId &&
        q.branchId === branchId &&
        q.queueDate.getTime() === date.getTime() &&
        ['WAITING', 'CALLED', 'IN_SERVICE'].includes(q.status),
    ).length;
  }

  async countLastQueueNumber(branchId: string, date: Date): Promise<number> {
    return [...this.queues.values()].filter((q) => q.branchId === branchId && q.queueDate.getTime() === date.getTime()).length;
  }

  async updateStatus(
    id: string,
    status: string,
    timestampField: 'calledAt' | 'startedAt' | 'completedAt' | 'cancelledAt' | null,
    updatedBy: string,
  ): Promise<Queue> {
    const queue = this.queues.get(id);
    if (!queue) throw new Error('not found');
    queue.status = status as Queue['status'];
    if (timestampField) {
      (queue[timestampField] as Date | null) = new Date();
    }
    queue.updatedBy = updatedBy;
    return queue;
  }

  async updateDoctor(id: string, doctorId: string, updatedBy: string): Promise<Queue> {
    const queue = this.queues.get(id);
    if (!queue) throw new Error('not found');
    queue.doctorId = doctorId;
    queue.updatedBy = updatedBy;
    return queue;
  }

  private applyScope(all: Queue[], scope: QueueDashboardScope): Queue[] {
    let result = all;
    if (scope.branchId) result = result.filter((q) => q.branchId === scope.branchId);
    if (scope.allowedBranchIds) result = result.filter((q) => scope.allowedBranchIds!.includes(q.branchId));
    if (scope.restrictToDoctorId) result = result.filter((q) => q.doctorId === scope.restrictToDoctorId);
    return result;
  }

  async countByStatus(scope: QueueDashboardScope, date?: Date): Promise<Record<string, number>> {
    let all = this.applyScope([...this.queues.values()], scope);
    if (date) all = all.filter((q) => q.queueDate.getTime() === date.getTime());
    const result: Record<string, number> = {};
    for (const q of all) {
      result[q.status] = (result[q.status] ?? 0) + 1;
    }
    return result;
  }

  async countByDoctor(scope: QueueDashboardScope, date?: Date): Promise<Array<{ doctorId: string; count: number }>> {
    let all = this.applyScope([...this.queues.values()], scope);
    if (date) all = all.filter((q) => q.queueDate.getTime() === date.getTime());
    const map = new Map<string, number>();
    for (const q of all) {
      map.set(q.doctorId, (map.get(q.doctorId) ?? 0) + 1);
    }
    return [...map.entries()].map(([doctorId, count]) => ({ doctorId, count }));
  }

  async findCompletedForMetrics(scope: QueueDashboardScope, date?: Date): Promise<Queue[]> {
    let all = this.applyScope([...this.queues.values()].filter((q) => q.status === 'COMPLETED'), scope);
    if (date) all = all.filter((q) => q.queueDate.getTime() === date.getTime());
    return all;
  }

  async countOpenByBranch(branchId: string): Promise<number> {
    return [...this.queues.values()].filter(
      (q) => q.branchId === branchId && !['COMPLETED', 'CANCELLED', 'NO_SHOW', 'SKIPPED'].includes(q.status),
    ).length;
  }
}

export class FakeQueueHistoryRepository implements IQueueHistoryRepository {
  entries: AppendQueueHistoryInput[] = [];

  async append(input: AppendQueueHistoryInput): Promise<void> {
    this.entries.push(input);
  }
}

export class FakeQueueCallRepository implements IQueueCallRepository {
  calls: QueueCall[] = [];

  async recordCall(queueId: string, calledBy: string): Promise<QueueCall> {
    const call: QueueCall = {
      id: nextFakeUuid(),
      queueId,
      recallNumber: (await this.countCallsForQueue(queueId)) + 1,
      calledBy,
      calledAt: new Date(),
    };
    this.calls.push(call);
    return call;
  }

  async countCallsForQueue(queueId: string): Promise<number> {
    return this.calls.filter((c) => c.queueId === queueId).length;
  }
}
