import { Queue } from '@prisma/client';
import { ListQueryDto } from '../../../../shared/http/ListQueryDto';
import { PagedResult } from '../../../../shared/http/pagination';

export interface QueueListFilters extends ListQueryDto {
  status?: string;
  doctorId?: string;
  branchId?: string;
  visitDate?: string;
}

export interface CreateQueueInput {
  reservationId?: string;
  branchId: string;
  patientId: string;
  doctorId: string;
  queueNumber: string;
  queuePrefix: string;
  queueDate: Date;
  queueType: 'WALK_IN' | 'RESERVATION' | 'EMERGENCY';
  priority?: 'NORMAL' | 'ELDERLY' | 'PREGNANT' | 'EMERGENCY' | 'VIP';
  createdBy: string;
}

export interface IQueueRepository {
  create(input: CreateQueueInput): Promise<Queue>;
  findById(id: string): Promise<Queue | null>;
  findByReservationId(reservationId: string): Promise<Queue | null>;
  search(filters: QueueListFilters): Promise<PagedResult<Queue>>;
  countActiveForPatientOnDate(patientId: string, branchId: string, date: Date): Promise<number>;
  countLastQueueNumber(branchId: string, date: Date): Promise<number>;
  updateStatus(id: string, status: string, timestampField: 'calledAt' | 'startedAt' | 'completedAt' | 'cancelledAt' | null, updatedBy: string): Promise<Queue>;
  updateDoctor(id: string, doctorId: string, updatedBy: string): Promise<Queue>;
  countByStatus(branchId?: string, date?: Date): Promise<Record<string, number>>;
  countByDoctor(branchId?: string, date?: Date): Promise<Array<{ doctorId: string; count: number }>>;
  findCompletedForMetrics(branchId?: string, date?: Date): Promise<Queue[]>;
  /** docs/06-tasks/task-225.md: queue entries not yet in a terminal status, for the Branch Deactivation Guard. */
  countOpenByBranch(branchId: string): Promise<number>;
}
