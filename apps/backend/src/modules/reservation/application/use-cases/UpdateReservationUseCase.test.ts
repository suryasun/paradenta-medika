import { UpdateReservationUseCase } from './UpdateReservationUseCase';
import { DoctorScheduleValidator } from '../services/DoctorScheduleValidator';
import { FakeDoctorRepository } from '../../../../../tests/fakes/masterDataFakes';
import { FakeDoctorScheduleRepository, FakeReservationRepository, buildDoctorSchedule } from '../../../../../tests/fakes/reservationFakes';
import { FakeAuditService } from '../../../../../tests/fakes/authFakes';
import { FakeEventBus } from '../../../../../tests/fakes/patientFakes';
import { InvalidReservationStatusException } from '../../domain/exceptions/ReservationExceptions';
import { parseTimeToDate } from '../services/timeUtils';

function nextMonday(): Date {
  const date = new Date();
  date.setUTCHours(0, 0, 0, 0);
  const daysUntilMonday = (8 - date.getUTCDay()) % 7 || 7;
  date.setUTCDate(date.getUTCDate() + daysUntilMonday);
  return date;
}

describe('UpdateReservationUseCase', () => {
  function buildSut() {
    const reservationRepository = new FakeReservationRepository();
    const doctorRepository = new FakeDoctorRepository();
    const scheduleRepository = new FakeDoctorScheduleRepository();
    const scheduleValidator = new DoctorScheduleValidator(doctorRepository, scheduleRepository, reservationRepository);
    const auditService = new FakeAuditService();
    const eventBus = new FakeEventBus();
    const useCase = new UpdateReservationUseCase(reservationRepository, doctorRepository, scheduleValidator, auditService, eventBus);
    return { reservationRepository, doctorRepository, scheduleRepository, auditService, useCase };
  }

  it('allows a valid update to a BOOKED reservation', async () => {
    const { reservationRepository, useCase } = buildSut();
    const reservation = await reservationRepository.create({
      reservationNo: 'RSV-1',
      patientId: 'p1',
      doctorId: 'd1',
      branchId: 'b1',
      reservationDate: nextMonday(),
      reservationTime: parseTimeToDate('09:00'),
      reservationType: 'APPOINTMENT',
      source: 'PHONE',
      createdBy: 'staff-1',
    });

    const updated = await useCase.execute({ reservationId: reservation.id, complaint: 'Updated complaint', actorUserId: 'staff-1' });

    expect(updated.complaint).toBe('Updated complaint');
  });

  it('rejects an update to a reservation already IN_SERVICE', async () => {
    const { reservationRepository, useCase } = buildSut();
    const reservation = await reservationRepository.create({
      reservationNo: 'RSV-2',
      patientId: 'p1',
      doctorId: 'd1',
      branchId: 'b1',
      reservationDate: nextMonday(),
      reservationTime: parseTimeToDate('09:00'),
      reservationType: 'APPOINTMENT',
      source: 'PHONE',
      createdBy: 'staff-1',
    });
    reservationRepository.reservations.get(reservation.id)!.status = 'IN_SERVICE';

    await expect(useCase.execute({ reservationId: reservation.id, complaint: 'x', actorUserId: 'staff-1' })).rejects.toBeInstanceOf(
      InvalidReservationStatusException,
    );
  });

  it('rejects an update to a completed reservation', async () => {
    const { reservationRepository, useCase } = buildSut();
    const reservation = await reservationRepository.create({
      reservationNo: 'RSV-3',
      patientId: 'p1',
      doctorId: 'd1',
      branchId: 'b1',
      reservationDate: nextMonday(),
      reservationTime: parseTimeToDate('09:00'),
      reservationType: 'APPOINTMENT',
      source: 'PHONE',
      createdBy: 'staff-1',
    });
    reservationRepository.reservations.get(reservation.id)!.status = 'COMPLETED';

    await expect(useCase.execute({ reservationId: reservation.id, complaint: 'x', actorUserId: 'staff-1' })).rejects.toBeInstanceOf(
      InvalidReservationStatusException,
    );
  });

  it('re-validates schedule availability when doctor/time changes', async () => {
    const { reservationRepository, doctorRepository, scheduleRepository, useCase } = buildSut();
    const doctor = await doctorRepository.create({ doctorCode: 'DOC01', userId: 'u1', branchId: 'branch-1', fullName: 'Dr. New' });
    const monday = nextMonday();
    scheduleRepository.seed(buildDoctorSchedule({ doctorId: doctor.id, dayOfWeek: monday.getUTCDay() }));
    const reservation = await reservationRepository.create({
      reservationNo: 'RSV-4',
      patientId: 'p1',
      doctorId: 'old-doctor',
      branchId: 'b1',
      reservationDate: monday,
      reservationTime: parseTimeToDate('09:00'),
      reservationType: 'APPOINTMENT',
      source: 'PHONE',
      createdBy: 'staff-1',
    });

    const updated = await useCase.execute({ reservationId: reservation.id, doctorId: doctor.id, actorUserId: 'staff-1' });

    expect(updated.doctorId).toBe(doctor.id);
    expect(updated.branchId).toBe('branch-1');
  });
});
