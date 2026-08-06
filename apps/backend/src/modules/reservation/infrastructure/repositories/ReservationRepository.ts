import { Prisma, Reservation, ReservationStatus } from '@prisma/client';
import { prisma } from '../../../../shared/infrastructure/prisma';
import { sanitizeSortField } from '../../../../shared/http/pagination';
import { PagedResult } from '../../../../shared/http/pagination';
import {
  CreateReservationInput,
  IReservationRepository,
  ReservationListFilters,
  ReservationWithOptionalPatient,
  UpdateReservationInput,
} from '../../domain/repositories/IReservationRepository';

const ALLOWED_SORT_FIELDS = ['createdAt', 'reservationDate', 'reservationTime'] as const;
const SLOT_BLOCKING_STATUSES: ReservationStatus[] = ['BOOKED', 'CONFIRMED', 'CHECK_IN', 'IN_QUEUE', 'IN_SERVICE', 'COMPLETED'];
const PATIENT_CONFLICT_STATUSES: ReservationStatus[] = ['BOOKED', 'CONFIRMED', 'CHECK_IN', 'IN_QUEUE', 'IN_SERVICE'];

/** docs/06-tasks/task-292.md: exported for reuse by QuickNewPatientCallRepository's atomic transaction, so that combined write does not duplicate this field-mapping. */
export function toReservationCreateData(input: CreateReservationInput): Prisma.ReservationUncheckedCreateInput {
  return {
    reservationNo: input.reservationNo,
    patientId: input.patientId,
    doctorId: input.doctorId,
    branchId: input.branchId,
    scheduleId: input.scheduleId,
    reservationDate: input.reservationDate,
    reservationTime: input.reservationTime,
    reservationType: input.reservationType,
    source: input.source,
    complaint: input.complaint,
    notes: input.notes,
    treatmentPlanItemId: input.treatmentPlanItemId,
    patientTypeAtBooking: input.patientTypeAtBooking ?? 'NEW',
    createdBy: input.createdBy,
  };
}

export class ReservationRepository implements IReservationRepository {
  async create(input: CreateReservationInput): Promise<Reservation> {
    return prisma.reservation.create({ data: toReservationCreateData(input) });
  }

  async findById(id: string): Promise<Reservation | null> {
    return prisma.reservation.findFirst({ where: { id, deletedAt: null } });
  }

  async findByReservationNo(reservationNo: string): Promise<Reservation | null> {
    return prisma.reservation.findFirst({ where: { reservationNo } });
  }

  async search(filters: ReservationListFilters): Promise<PagedResult<ReservationWithOptionalPatient>> {
    const where: Prisma.ReservationWhereInput = {
      deletedAt: null,
      ...(filters.search
        ? {
            OR: [
              { reservationNo: { contains: filters.search } },
              { complaint: { contains: filters.search } },
            ],
          }
        : {}),
      ...(filters.doctorId ? { doctorId: filters.doctorId } : {}),
      ...(filters.status ? { status: filters.status as ReservationStatus } : {}),
      ...(filters.reservationType ? { reservationType: filters.reservationType } : {}),
      ...(filters.reservationSource ? { source: filters.reservationSource as Prisma.EnumReservationSourceFilter['equals'] } : {}),
      ...(filters.patientType ? { patientTypeAtBooking: filters.patientType } : {}),
      ...(filters.dateFrom || filters.dateTo
        ? {
            reservationDate: {
              ...(filters.dateFrom ? { gte: new Date(filters.dateFrom) } : {}),
              ...(filters.dateTo ? { lte: new Date(filters.dateTo) } : {}),
            },
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      prisma.reservation.findMany({
        where,
        // docs/06-tasks/task-296.md (R1): lightweight MRN+name snapshot
        // only -- not a full Patient embed (see ReservationMapper's own
        // comment on why this module doesn't duplicate cross-module
        // entities beyond what a list screen needs to render).
        include: { patient: { select: { medicalRecordNo: true, patientName: true } } },
        orderBy: { [sanitizeSortField(filters.sort, ALLOWED_SORT_FIELDS)]: filters.order },
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit,
      }),
      prisma.reservation.count({ where }),
    ]);

    return { items, total };
  }

  async update(id: string, input: UpdateReservationInput): Promise<Reservation> {
    return prisma.reservation.update({
      where: { id },
      data: {
        doctorId: input.doctorId,
        branchId: input.branchId,
        scheduleId: input.scheduleId,
        reservationDate: input.reservationDate,
        reservationTime: input.reservationTime,
        reservationType: input.reservationType,
        complaint: input.complaint,
        notes: input.notes,
        updatedBy: input.updatedBy,
      },
    });
  }

  async cancel(id: string, reason: string, updatedBy: string): Promise<Reservation> {
    return prisma.reservation.update({
      where: { id },
      data: { status: 'CANCELLED', cancelledReason: reason, cancelledAt: new Date(), updatedBy },
    });
  }

  async checkIn(id: string, updatedBy: string): Promise<Reservation> {
    return prisma.reservation.update({
      where: { id },
      data: { status: 'CHECK_IN', checkedInAt: new Date(), updatedBy },
    });
  }

  async countActiveAtSlot(doctorId: string, date: Date, time: Date, excludeId?: string): Promise<number> {
    return prisma.reservation.count({
      where: {
        doctorId,
        reservationDate: date,
        reservationTime: time,
        status: { in: SLOT_BLOCKING_STATUSES },
        deletedAt: null,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });
  }

  async countActiveForPatientOnDate(patientId: string, date: Date, excludeId?: string): Promise<number> {
    return prisma.reservation.count({
      where: {
        patientId,
        reservationDate: date,
        status: { in: PATIENT_CONFLICT_STATUSES },
        deletedAt: null,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });
  }

  async count(): Promise<number> {
    return prisma.reservation.count();
  }

  async countByDate(date: Date, branchId?: string): Promise<number> {
    return prisma.reservation.count({
      where: { reservationDate: date, deletedAt: null, ...(branchId ? { branchId } : {}) },
    });
  }

  async findAllInDateRange(
    dateFrom: Date,
    dateTo: Date,
    branchId?: string,
    patientType?: 'NEW' | 'OLD',
    status?: string,
  ): Promise<Reservation[]> {
    return prisma.reservation.findMany({
      where: {
        reservationDate: { gte: dateFrom, lte: dateTo },
        deletedAt: null,
        ...(branchId ? { branchId } : {}),
        ...(patientType ? { patientTypeAtBooking: patientType } : {}),
        ...(status ? { status: status as ReservationStatus } : {}),
      },
    });
  }

  async countOpenByBranch(branchId: string): Promise<number> {
    return prisma.reservation.count({
      where: {
        branchId,
        deletedAt: null,
        status: { notIn: ['COMPLETED', 'CANCELLED', 'NO_SHOW'] },
      },
    });
  }

  async countEligibleForPatient(patientId: string): Promise<number> {
    return prisma.reservation.count({
      where: {
        patientId,
        deletedAt: null,
        status: { notIn: ['CANCELLED', 'NO_SHOW'] },
      },
    });
  }
}
