import { IDoctorRepository } from '../../../master-data/domain/repositories/IDoctorRepository';
import { IDoctorScheduleRepository } from '../../domain/repositories/IDoctorScheduleRepository';
import { IReservationRepository } from '../../domain/repositories/IReservationRepository';
import { TimeSlotDto } from '../dtos/TimeSlotDto';

function minutesOfDay(time: Date): number {
  return time.getUTCHours() * 60 + time.getUTCMinutes();
}

function minutesToTimeString(minutes: number): string {
  const hours = Math.floor(minutes / 60)
    .toString()
    .padStart(2, '0');
  const mins = (minutes % 60).toString().padStart(2, '0');
  return `${hours}:${mins}`;
}

function minutesToDate(minutes: number): Date {
  return new Date(Date.UTC(1970, 0, 1, Math.floor(minutes / 60), minutes % 60));
}

/**
 * docs/06-tasks/task-036.md: generates non-conflicting bookable slots per
 * docs/03-sad/13-module-reservation.md Section 16.4 Slot Calculation
 * (Total Capacity - Confirmed - Checked-in = Available Slot). An inactive
 * doctor or a day with no active schedule returns an empty slot list.
 */
export class GetDoctorTimeSlotsUseCase {
  constructor(
    private readonly doctorRepository: IDoctorRepository,
    private readonly scheduleRepository: IDoctorScheduleRepository,
    private readonly reservationRepository: IReservationRepository,
  ) {}

  async execute(doctorId: string, date: string): Promise<TimeSlotDto[]> {
    const doctor = await this.doctorRepository.findById(doctorId);
    if (!doctor || !doctor.isActive) {
      return [];
    }

    const reservationDate = new Date(`${date}T00:00:00.000Z`);
    const dayOfWeek = reservationDate.getUTCDay();
    const schedules = await this.scheduleRepository.findActiveForDoctorOnDay(doctorId, dayOfWeek);

    const slots: TimeSlotDto[] = [];
    for (const schedule of schedules) {
      const startMinutes = minutesOfDay(schedule.startTime);
      const endMinutes = minutesOfDay(schedule.endTime);
      for (let cursor = startMinutes; cursor < endMinutes; cursor += schedule.slotDuration) {
        const slotTime = minutesToDate(cursor);
        const reserved = await this.reservationRepository.countActiveAtSlot(doctorId, reservationDate, slotTime);
        const available = Math.max(0, schedule.maxPatient - reserved);
        slots.push({
          time: minutesToTimeString(cursor),
          capacity: schedule.maxPatient,
          reserved,
          available,
          status: available > 0 ? 'AVAILABLE' : 'FULL',
        });
      }
    }

    return slots;
  }
}
