import { Reservation } from '@prisma/client';
import { ListQueryDto } from '../../../../shared/http/ListQueryDto';
import { PagedResult } from '../../../../shared/http/pagination';

export interface ReservationListFilters extends ListQueryDto {
  doctorId?: string;
  status?: string;
  reservationType?: string;
  reservationSource?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface CreateReservationInput {
  reservationNo: string;
  patientId: string;
  doctorId: string;
  branchId: string;
  scheduleId?: string;
  reservationDate: Date;
  reservationTime: Date;
  reservationType: string;
  source: 'WALK_IN' | 'PHONE' | 'WHATSAPP' | 'WEBSITE' | 'MOBILE_APP';
  complaint?: string;
  notes?: string;
  /** docs/06-tasks/task-064.md: set when this Reservation originates from converting a Treatment Plan item. */
  treatmentPlanItemId?: string;
  createdBy: string;
}

export interface UpdateReservationInput {
  doctorId?: string;
  branchId?: string;
  scheduleId?: string | null;
  reservationDate?: Date;
  reservationTime?: Date;
  reservationType?: string;
  complaint?: string;
  notes?: string;
  updatedBy: string;
}

export interface IReservationRepository {
  create(input: CreateReservationInput): Promise<Reservation>;
  findById(id: string): Promise<Reservation | null>;
  findByReservationNo(reservationNo: string): Promise<Reservation | null>;
  search(filters: ReservationListFilters): Promise<PagedResult<Reservation>>;
  update(id: string, input: UpdateReservationInput): Promise<Reservation>;
  cancel(id: string, reason: string, updatedBy: string): Promise<Reservation>;
  checkIn(id: string, updatedBy: string): Promise<Reservation>;
  countActiveAtSlot(doctorId: string, date: Date, time: Date, excludeId?: string): Promise<number>;
  countActiveForPatientOnDate(patientId: string, date: Date, excludeId?: string): Promise<number>;
  count(): Promise<number>;
  countByDate(date: Date, branchId?: string): Promise<number>;
  /** docs/06-tasks/task-060.md: raw rows for in-memory analytics aggregation over a date range. */
  findAllInDateRange(dateFrom: Date, dateTo: Date, branchId?: string): Promise<Reservation[]>;
  /** docs/06-tasks/task-225.md: reservations not yet in a terminal status (COMPLETED/CANCELLED/NO_SHOW), for the Branch Deactivation Guard. */
  countOpenByBranch(branchId: string): Promise<number>;
}
