import { GetDoctorTimeSlotsUseCase } from './GetDoctorTimeSlotsUseCase';
import { FakeDoctorRepository } from '../../../../../tests/fakes/masterDataFakes';
import { FakeDoctorScheduleRepository, FakeReservationRepository, buildDoctorSchedule } from '../../../../../tests/fakes/reservationFakes';
import { parseTimeToDate } from '../services/timeUtils';

function nextMonday(): Date {
  const date = new Date();
  date.setUTCHours(0, 0, 0, 0);
  const daysUntilMonday = (8 - date.getUTCDay()) % 7 || 7;
  date.setUTCDate(date.getUTCDate() + daysUntilMonday);
  return date;
}

describe('GetDoctorTimeSlotsUseCase', () => {
  it('excludes a fully-booked slot from the returned availability', async () => {
    const doctorRepository = new FakeDoctorRepository();
    const scheduleRepository = new FakeDoctorScheduleRepository();
    const reservationRepository = new FakeReservationRepository();
    const useCase = new GetDoctorTimeSlotsUseCase(doctorRepository, scheduleRepository, reservationRepository);

    const doctor = await doctorRepository.create({ doctorCode: 'DOC01', userId: 'u1', branchId: 'b1', fullName: 'Dr. Test' });
    const monday = nextMonday();
    scheduleRepository.seed(
      buildDoctorSchedule({
        doctorId: doctor.id,
        dayOfWeek: monday.getUTCDay(),
        startTime: new Date('1970-01-01T09:00:00.000Z'),
        endTime: new Date('1970-01-01T10:00:00.000Z'),
        slotDuration: 30,
        maxPatient: 1,
      }),
    );
    await reservationRepository.create({
      reservationNo: 'RSV-1',
      patientId: 'p1',
      doctorId: doctor.id,
      branchId: 'b1',
      reservationDate: monday,
      reservationTime: parseTimeToDate('09:00'),
      reservationType: 'APPOINTMENT',
      source: 'PHONE',
      createdBy: 'staff-1',
    });

    const slots = await useCase.execute(doctor.id, monday.toISOString().slice(0, 10));

    expect(slots).toHaveLength(2);
    expect(slots.find((s) => s.time === '09:00')?.status).toBe('FULL');
    expect(slots.find((s) => s.time === '09:30')?.status).toBe('AVAILABLE');
  });

  it('returns no availability for an inactive doctor', async () => {
    const doctorRepository = new FakeDoctorRepository();
    const scheduleRepository = new FakeDoctorScheduleRepository();
    const reservationRepository = new FakeReservationRepository();
    const useCase = new GetDoctorTimeSlotsUseCase(doctorRepository, scheduleRepository, reservationRepository);

    const doctor = await doctorRepository.create({ doctorCode: 'DOC02', userId: 'u2', branchId: 'b1', fullName: 'Dr. Inactive' });
    doctorRepository.doctors.get(doctor.id)!.isActive = false;
    const monday = nextMonday();
    scheduleRepository.seed(buildDoctorSchedule({ doctorId: doctor.id, dayOfWeek: monday.getUTCDay() }));

    const slots = await useCase.execute(doctor.id, monday.toISOString().slice(0, 10));

    expect(slots).toEqual([]);
  });
});
