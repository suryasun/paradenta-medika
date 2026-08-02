import { DoctorSchedule, Reservation, ReservationStatus } from '@prisma/client';
import {
  CreateReservationInput,
  IReservationRepository,
  ReservationListFilters,
  UpdateReservationInput,
} from '../../src/modules/reservation/domain/repositories/IReservationRepository';
import { IDoctorScheduleRepository } from '../../src/modules/reservation/domain/repositories/IDoctorScheduleRepository';
import { AppendTimelineInput, IReservationTimelineRepository } from '../../src/modules/reservation/domain/repositories/IReservationTimelineRepository';
import { PagedResult } from '../../src/shared/http/pagination';
import { nextFakeUuid } from './uuid';

const SLOT_BLOCKING_STATUSES: ReservationStatus[] = ['BOOKED', 'CONFIRMED', 'CHECK_IN', 'IN_QUEUE', 'IN_SERVICE', 'COMPLETED'];
const PATIENT_CONFLICT_STATUSES: ReservationStatus[] = ['BOOKED', 'CONFIRMED', 'CHECK_IN', 'IN_QUEUE', 'IN_SERVICE'];

export class FakeReservationRepository implements IReservationRepository {
  reservations = new Map<string, Reservation>();

  async create(input: CreateReservationInput): Promise<Reservation> {
    const reservation: Reservation = {
      id: nextFakeUuid(),
      reservationNo: input.reservationNo,
      patientId: input.patientId,
      doctorId: input.doctorId,
      branchId: input.branchId,
      scheduleId: input.scheduleId ?? null,
      reservationDate: input.reservationDate,
      reservationTime: input.reservationTime,
      reservationType: input.reservationType,
      complaint: input.complaint ?? null,
      notes: input.notes ?? null,
      status: 'BOOKED',
      source: input.source,
      checkedInAt: null,
      cancelledReason: null,
      cancelledAt: null,
      createdAt: new Date(),
      createdBy: input.createdBy,
      updatedAt: new Date(),
      updatedBy: null,
      deletedAt: null,
      deletedBy: null,
    } as Reservation;
    this.reservations.set(reservation.id, reservation);
    return reservation;
  }

  async findById(id: string): Promise<Reservation | null> {
    return this.reservations.get(id) ?? null;
  }

  async findByReservationNo(reservationNo: string): Promise<Reservation | null> {
    return [...this.reservations.values()].find((r) => r.reservationNo === reservationNo) ?? null;
  }

  async search(filters: ReservationListFilters): Promise<PagedResult<Reservation>> {
    let all = [...this.reservations.values()];
    if (filters.doctorId) all = all.filter((r) => r.doctorId === filters.doctorId);
    if (filters.status) all = all.filter((r) => r.status === filters.status);
    if (filters.reservationType) all = all.filter((r) => r.reservationType === filters.reservationType);
    if (filters.reservationSource) all = all.filter((r) => r.source === filters.reservationSource);
    const start = (filters.page - 1) * filters.limit;
    return { items: all.slice(start, start + filters.limit), total: all.length };
  }

  async update(id: string, input: UpdateReservationInput): Promise<Reservation> {
    const reservation = this.reservations.get(id);
    if (!reservation) throw new Error('not found');
    if (input.doctorId) reservation.doctorId = input.doctorId;
    if (input.branchId) reservation.branchId = input.branchId;
    if (input.scheduleId !== undefined) reservation.scheduleId = input.scheduleId;
    if (input.reservationDate) reservation.reservationDate = input.reservationDate;
    if (input.reservationTime) reservation.reservationTime = input.reservationTime;
    if (input.reservationType) reservation.reservationType = input.reservationType;
    if (input.complaint !== undefined) reservation.complaint = input.complaint ?? null;
    if (input.notes !== undefined) reservation.notes = input.notes ?? null;
    reservation.updatedBy = input.updatedBy;
    reservation.updatedAt = new Date();
    return reservation;
  }

  async cancel(id: string, reason: string, updatedBy: string): Promise<Reservation> {
    const reservation = this.reservations.get(id);
    if (!reservation) throw new Error('not found');
    reservation.status = 'CANCELLED';
    reservation.cancelledReason = reason;
    reservation.cancelledAt = new Date();
    reservation.updatedBy = updatedBy;
    return reservation;
  }

  async checkIn(id: string, updatedBy: string): Promise<Reservation> {
    const reservation = this.reservations.get(id);
    if (!reservation) throw new Error('not found');
    reservation.status = 'CHECK_IN';
    reservation.checkedInAt = new Date();
    reservation.updatedBy = updatedBy;
    return reservation;
  }

  async countActiveAtSlot(doctorId: string, date: Date, time: Date, excludeId?: string): Promise<number> {
    return [...this.reservations.values()].filter(
      (r) =>
        r.doctorId === doctorId &&
        r.reservationDate.getTime() === date.getTime() &&
        r.reservationTime.getTime() === time.getTime() &&
        SLOT_BLOCKING_STATUSES.includes(r.status) &&
        r.id !== excludeId,
    ).length;
  }

  async countActiveForPatientOnDate(patientId: string, date: Date, excludeId?: string): Promise<number> {
    return [...this.reservations.values()].filter(
      (r) =>
        r.patientId === patientId &&
        r.reservationDate.getTime() === date.getTime() &&
        PATIENT_CONFLICT_STATUSES.includes(r.status) &&
        r.id !== excludeId,
    ).length;
  }

  async count(): Promise<number> {
    return this.reservations.size;
  }

  async countByDate(date: Date, branchId?: string): Promise<number> {
    return [...this.reservations.values()].filter(
      (r) => r.reservationDate.getTime() === date.getTime() && (!branchId || r.branchId === branchId),
    ).length;
  }
}

export class FakeDoctorScheduleRepository implements IDoctorScheduleRepository {
  schedules = new Map<string, DoctorSchedule>();

  seed(schedule: DoctorSchedule): void {
    this.schedules.set(schedule.id, schedule);
  }

  async findById(id: string): Promise<DoctorSchedule | null> {
    return this.schedules.get(id) ?? null;
  }

  async findActiveForDoctorOnDay(doctorId: string, dayOfWeek: number): Promise<DoctorSchedule[]> {
    return [...this.schedules.values()].filter((s) => s.doctorId === doctorId && s.dayOfWeek === dayOfWeek && s.isActive);
  }
}

export function buildDoctorSchedule(overrides: Partial<DoctorSchedule> = {}): DoctorSchedule {
  return {
    id: nextFakeUuid(),
    doctorId: nextFakeUuid(),
    dayOfWeek: 1,
    startTime: new Date('1970-01-01T08:00:00.000Z'),
    endTime: new Date('1970-01-01T12:00:00.000Z'),
    slotDuration: 30,
    maxPatient: 1,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    ...overrides,
  };
}

export class FakeReservationTimelineRepository implements IReservationTimelineRepository {
  entries: AppendTimelineInput[] = [];

  async append(input: AppendTimelineInput): Promise<void> {
    this.entries.push(input);
  }
}
