import { DoctorSchedule } from '@prisma/client';
import { IDoctorRepository } from '../../../master-data/domain/repositories/IDoctorRepository';
import { ReservationEntity } from '../../domain/entities/ReservationEntity';
import {
  DoctorScheduleUnavailableException,
  PatientAlreadyHasActiveReservationException,
  TimeSlotAlreadyReservedException,
} from '../../domain/exceptions/ReservationExceptions';
import { IDoctorScheduleRepository } from '../../domain/repositories/IDoctorScheduleRepository';
import { IReservationRepository } from '../../domain/repositories/IReservationRepository';

export interface ScheduleValidationParams {
  doctorId: string;
  patientId: string;
  reservationDate: Date;
  reservationTime: Date;
  excludeReservationId?: string;
}

function minutesOfDay(time: Date): number {
  return time.getUTCHours() * 60 + time.getUTCMinutes();
}

/**
 * docs/03-sad/13-module-reservation.md Section 15.3 Validation Rules:
 * doctor active, schedule available for the day/time, slot not full, no
 * double booking. "Tidak sedang cuti" (on leave) and "bukan hari libur"
 * (not a holiday) are NOT implemented: no leave/holiday table is defined
 * anywhere in the SAD (Section 15/16 only describe them as bullet points,
 * with no schema) -- flagged as a documented gap rather than invented.
 */
export class DoctorScheduleValidator {
  constructor(
    private readonly doctorRepository: IDoctorRepository,
    private readonly scheduleRepository: IDoctorScheduleRepository,
    private readonly reservationRepository: IReservationRepository,
  ) {}

  async validate(params: ScheduleValidationParams): Promise<DoctorSchedule> {
    ReservationEntity.assertDateNotInPast(params.reservationDate);

    const doctor = await this.doctorRepository.findById(params.doctorId);
    if (!doctor || !doctor.isActive) {
      throw new DoctorScheduleUnavailableException('Doctor is not active');
    }

    const dayOfWeek = params.reservationDate.getUTCDay();
    const schedules = await this.scheduleRepository.findActiveForDoctorOnDay(params.doctorId, dayOfWeek);
    const requestedMinutes = minutesOfDay(params.reservationTime);

    const matchingSchedule = schedules.find((schedule) => {
      const start = minutesOfDay(schedule.startTime);
      const end = minutesOfDay(schedule.endTime);
      return requestedMinutes >= start && requestedMinutes < end;
    });

    if (!matchingSchedule) {
      throw new DoctorScheduleUnavailableException('No active schedule for the selected day/time');
    }

    const slotCount = await this.reservationRepository.countActiveAtSlot(
      params.doctorId,
      params.reservationDate,
      params.reservationTime,
      params.excludeReservationId,
    );
    if (slotCount >= matchingSchedule.maxPatient) {
      throw new TimeSlotAlreadyReservedException();
    }

    const patientConflicts = await this.reservationRepository.countActiveForPatientOnDate(
      params.patientId,
      params.reservationDate,
      params.excludeReservationId,
    );
    if (patientConflicts > 0) {
      throw new PatientAlreadyHasActiveReservationException();
    }

    return matchingSchedule;
  }
}
