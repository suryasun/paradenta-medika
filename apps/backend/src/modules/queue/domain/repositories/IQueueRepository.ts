import { Patient, Queue } from '@prisma/client';
import { ListQueryDto } from '../../../../shared/http/ListQueryDto';
import { PagedResult } from '../../../../shared/http/pagination';

/** docs/06-tasks/task-313.md: lightweight patient snapshot joined onto
 * Queue reads, mirroring Reservation Module Addendum #2's identical
 * pattern -- not a full Patient embed. `patient` is optional so every
 * non-search/findById call site (create/call/recall/skip/start/complete/
 * cancel/transfer) still satisfies the type unmodified.
 *
 * `visit` (docs/06-tasks/task-319.md) surfaces the linked Visit's id, if
 * one already exists, so the frontend can navigate straight to
 * /emr/visits/:id for a CALLED/IN_SERVICE/COMPLETED queue entry -- not
 * just re-run the CALLED-only "Open Visit" (create) action. Same
 * same-query-relation-include precedent as `patient` above (Queue already
 * has a Prisma `visit Visit?` relation). */
export type QueueWithOptionalPatient = Queue & {
  patient?: Pick<Patient, 'medicalRecordNo' | 'patientName'>;
  visit?: { id: string } | null;
};

export interface QueueListFilters extends ListQueryDto {
  status?: string;
  doctorId?: string;
  branchId?: string;
  visitDate?: string;
  /** docs/06-tasks/task-311.md: server-computed branch scope, resolved from
   * the requesting user's UserBranch assignments (undefined = no
   * restriction, e.g. a cross-branch role) -- never a client-supplied value. */
  allowedBranchIds?: string[];
  /** docs/06-tasks/task-312.md: server-computed Doctor self-scope, resolved
   * from the requesting user's own Doctor record when their role is Doctor. */
  restrictToDoctorId?: string;
}

/** docs/06-tasks/task-311.md/task-312.md: scope applied to the Dashboard's
 * aggregate queries, mirroring QueueListFilters' scope fields plus the
 * dashboard's own optional explicit branchId query param. */
export interface QueueDashboardScope {
  branchId?: string;
  allowedBranchIds?: string[];
  restrictToDoctorId?: string;
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
  findById(id: string): Promise<QueueWithOptionalPatient | null>;
  findByReservationId(reservationId: string): Promise<Queue | null>;
  search(filters: QueueListFilters): Promise<PagedResult<QueueWithOptionalPatient>>;
  countActiveForPatientOnDate(patientId: string, branchId: string, date: Date): Promise<number>;
  countLastQueueNumber(branchId: string, date: Date): Promise<number>;
  updateStatus(id: string, status: string, timestampField: 'calledAt' | 'startedAt' | 'completedAt' | 'cancelledAt' | null, updatedBy: string): Promise<Queue>;
  updateDoctor(id: string, doctorId: string, updatedBy: string): Promise<Queue>;
  countByStatus(scope: QueueDashboardScope, date?: Date): Promise<Record<string, number>>;
  countByDoctor(scope: QueueDashboardScope, date?: Date): Promise<Array<{ doctorId: string; count: number }>>;
  findCompletedForMetrics(scope: QueueDashboardScope, date?: Date): Promise<Queue[]>;
  /** docs/06-tasks/task-225.md: queue entries not yet in a terminal status, for the Branch Deactivation Guard. */
  countOpenByBranch(branchId: string): Promise<number>;
}
