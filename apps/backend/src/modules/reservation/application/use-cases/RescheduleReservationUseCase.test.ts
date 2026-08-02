import { RescheduleReservationUseCase } from './RescheduleReservationUseCase';
import { DoctorScheduleValidator } from '../services/DoctorScheduleValidator';
import { FakeDoctorRepository } from '../../../../../tests/fakes/masterDataFakes';
import {
  FakeDoctorScheduleRepository,
  FakeReservationRepository,
  FakeReservationTimelineRepository,
  buildDoctorSchedule,
} from '../../../../../tests/fakes/reservationFakes';
import { FakeAuditService } from '../../../../../tests/fakes/authFakes';
import { FakeEventBus } from '../../../../../tests/fakes/patientFakes';
import { parseTimeToDate } from '../services/timeUtils';
import { TimeSlotAlreadyReservedException } from '../../domain/exceptions/ReservationExceptions';

function nextMonday(offsetWeeks = 0): Date {
  const date = new Date();
  date.setUTCHours(0, 0, 0, 0);
  const daysUntilMonday = (8 - date.getUTCDay()) % 7 || 7;
  date.setUTCDate(date.getUTCDate() + daysUntilMonday + offsetWeeks * 7);
  return date;
}

describe('RescheduleReservationUseCase', () => {
  function buildSut() {
    const reservationRepository = new FakeReservationRepository();
    const timelineRepository = new FakeReservationTimelineRepository();
    const doctorRepository = new FakeDoctorRepository();
    const scheduleRepository = new FakeDoctorScheduleRepository();
    const scheduleValidator = new DoctorScheduleValidator(doctorRepository, scheduleRepository, reservationRepository);
    const auditService = new FakeAuditService();
    const eventBus = new FakeEventBus();
    const useCase = new RescheduleReservationUseCase(reservationRepository, timelineRepository, scheduleValidator, auditService, eventBus);
    return { reservationRepository, timelineRepository, doctorRepository, scheduleRepository, useCase };
  }

  it('moves the reservation to a new valid slot and records a timeline entry', async () => {
    const { reservationRepository, timelineRepository, doctorRepository, scheduleRepository, useCase } = buildSut();
    const doctor = await doctorRepository.create({ doctorCode: 'DOC01', userId: 'u1', branchId: 'b1', fullName: 'Dr. Test' });
    const originalMonday = nextMonday();
    const nextWeekMonday = nextMonday(1);
    scheduleRepository.seed(buildDoctorSchedule({ doctorId: doctor.id, dayOfWeek: originalMonday.getUTCDay() }));
    const reservation = await reservationRepository.create({
      reservationNo: 'RSV-1',
      patientId: 'p1',
      doctorId: doctor.id,
      branchId: 'b1',
      reservationDate: originalMonday,
      reservationTime: parseTimeToDate('09:00'),
      reservationType: 'APPOINTMENT',
      source: 'PHONE',
      createdBy: 'staff-1',
    });

    const result = await useCase.execute({
      reservationId: reservation.id,
      reservationDate: nextWeekMonday.toISOString().slice(0, 10),
      startTime: '09:30',
      actorUserId: 'staff-1',
    });

    expect(result.reservationDate).toBe(nextWeekMonday.toISOString().slice(0, 10));
    expect(result.startTime).toBe('09:30');
    expect(timelineRepository.entries).toHaveLength(1);
  });

  it('rejects rescheduling into a full slot', async () => {
    const { reservationRepository, doctorRepository, scheduleRepository, useCase } = buildSut();
    const doctor = await doctorRepository.create({ doctorCode: 'DOC02', userId: 'u2', branchId: 'b1', fullName: 'Dr. Full' });
    const monday = nextMonday();
    scheduleRepository.seed(buildDoctorSchedule({ doctorId: doctor.id, dayOfWeek: monday.getUTCDay(), maxPatient: 1 }));
    await reservationRepository.create({
      reservationNo: 'RSV-2',
      patientId: 'other-patient',
      doctorId: doctor.id,
      branchId: 'b1',
      reservationDate: monday,
      reservationTime: parseTimeToDate('10:00'),
      reservationType: 'APPOINTMENT',
      source: 'PHONE',
      createdBy: 'staff-1',
    });
    const reservation = await reservationRepository.create({
      reservationNo: 'RSV-3',
      patientId: 'p1',
      doctorId: doctor.id,
      branchId: 'b1',
      reservationDate: monday,
      reservationTime: parseTimeToDate('09:00'),
      reservationType: 'APPOINTMENT',
      source: 'PHONE',
      createdBy: 'staff-1',
    });

    await expect(
      useCase.execute({ reservationId: reservation.id, reservationDate: monday.toISOString().slice(0, 10), startTime: '10:00', actorUserId: 'staff-1' }),
    ).rejects.toBeInstanceOf(TimeSlotAlreadyReservedException);
  });
});
