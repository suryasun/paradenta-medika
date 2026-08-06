import { Patient, Reservation } from '@prisma/client';
import { ListQueryDto } from '../../../../shared/http/ListQueryDto';
import { PagedResult } from '../../../../shared/http/pagination';

/**
 * docs/06-tasks/task-296.md (Reservation Module Addendum #2, R1): a
 * lightweight patient snapshot (MRN + name only, not a full Patient
 * embed) joined onto list rows so the Reservation List/History screens
 * can render Patient Name/MRN without an unbounded client-side join --
 * closes the documented gap in docs/03-sad/13-module-reservation.md
 * §33.3 and ReservationListView.tsx's own long-standing comment.
 * `patient` is optional so every other call site that returns a plain
 * `Reservation` (create/update/cancel/checkIn/findById, none of which
 * join the relation) still satisfies this type unmodified.
 */
export type ReservationWithOptionalPatient = Reservation & {
  patient?: Pick<Patient, 'medicalRecordNo' | 'patientName'>;
};

export interface ReservationListFilters extends ListQueryDto {
  doctorId?: string;
  status?: string;
  reservationType?: string;
  reservationSource?: string;
  dateFrom?: string;
  dateTo?: string;
  /** docs/06-tasks/task-290.md: filters against the stored `patient_type_at_booking` snapshot. */
  patientType?: 'NEW' | 'OLD';
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
  /**
   * docs/06-tasks/task-290.md: permanent snapshot, computed by the caller
   * (CreateReservationUseCase / WalkInRegistrationUseCase /
   * QuickNewPatientCallUseCase) via countEligibleForPatient() below --
   * never recomputed after creation. Optional (defaults to 'NEW' at the
   * repository layer) only so pre-existing tests that construct a
   * reservation directly through this interface without exercising that
   * computation don't need updating one-by-one; every real use case always
   * passes it explicitly.
   */
  patientTypeAtBooking?: 'NEW' | 'OLD';
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
  search(filters: ReservationListFilters): Promise<PagedResult<ReservationWithOptionalPatient>>;
  update(id: string, input: UpdateReservationInput): Promise<Reservation>;
  cancel(id: string, reason: string, updatedBy: string): Promise<Reservation>;
  checkIn(id: string, updatedBy: string): Promise<Reservation>;
  countActiveAtSlot(doctorId: string, date: Date, time: Date, excludeId?: string): Promise<number>;
  countActiveForPatientOnDate(patientId: string, date: Date, excludeId?: string): Promise<number>;
  count(): Promise<number>;
  countByDate(date: Date, branchId?: string): Promise<number>;
  /**
   * docs/06-tasks/task-060.md: raw rows for in-memory analytics aggregation
   * over a date range. docs/06-tasks/task-291.md extends this with an
   * optional patientType filter, reused for that report's summary
   * aggregation (totalNewPatients/topProcedure/conversionRate) over the
   * full matching set, not just one paginated page. docs/06-tasks/task-299.md
   * (Reservation Module Addendum #2, R7) adds an optional status filter,
   * following that same precedent, for the Completed Reservation Report's
   * trend aggregation.
   */
  findAllInDateRange(
    dateFrom: Date,
    dateTo: Date,
    branchId?: string,
    patientType?: 'NEW' | 'OLD',
    status?: string,
  ): Promise<Reservation[]>;
  /** docs/06-tasks/task-225.md: reservations not yet in a terminal status (COMPLETED/CANCELLED/NO_SHOW), for the Branch Deactivation Guard. */
  countOpenByBranch(branchId: string): Promise<number>;
  /**
   * docs/06-tasks/task-290.md: count of this patient's reservations with
   * status NOT IN (CANCELLED, NO_SHOW), across all dates. Used both by
   * CreateReservationUseCase/WalkInRegistrationUseCase/
   * QuickNewPatientCallUseCase (called BEFORE creating the new reservation,
   * to compute patient_type_at_booking) and by the Patient module's
   * RESERVATION_CREATED_EVENT subscriber (called AFTER creation, to decide
   * whether the patient has now had a second eligible reservation).
   */
  countEligibleForPatient(patientId: string): Promise<number>;
}
