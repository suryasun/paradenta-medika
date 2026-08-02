import { DoctorScheduleValidator } from './DoctorScheduleValidator';
import { parseTimeToDate } from './timeUtils';
import { FakeDoctorRepository } from '../../../../../tests/fakes/masterDataFakes';
import { FakeDoctorScheduleRepository, FakeReservationRepository, buildDoctorSchedule } from '../../../../../tests/fakes/reservationFakes';
import {
  DoctorScheduleUnavailableException,
  PatientAlreadyHasActiveReservationException,
  ReservationDateInPastException,
  TimeSlotAlreadyReservedException,
} from '../../domain/exceptions/ReservationExceptions';

function nextMonday(): Date {
  const date = new Date();
  date.setUTCHours(0, 0, 0, 0);
  const daysUntilMonday = (8 - date.getUTCDay()) % 7 || 7;
  date.setUTCDate(date.getUTCDate() + daysUntilMonday);
  return date;
}

describe('DoctorScheduleValidator', () => {
  function buildSut() {
    const doctorRepository = new FakeDoctorRepository();
    const scheduleRepository = new FakeDoctorScheduleRepository();
    const reservationRepository = new FakeReservationRepository();
    const validator = new DoctorScheduleValidator(doctorRepository, scheduleRepository, reservationRepository);
    return { doctorRepository, scheduleRepository, reservationRepository, validator };
  }

  it('rejects a past reservation date', async () => {
    const { doctorRepository, validator } = buildSut();
    const doctor = await doctorRepository.create({ doctorCode: 'DOC01', userId: 'u1', branchId: 'b1', fullName: 'Dr. Test' });
    const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000);

    await expect(
      validator.validate({ doctorId: doctor.id, patientId: 'p1', reservationDate: pastDate, reservationTime: parseTimeToDate('09:00') }),
    ).rejects.toBeInstanceOf(ReservationDateInPastException);
  });

  it('rejects an inactive doctor', async () => {
    const { doctorRepository, validator } = buildSut();
    const doctor = await doctorRepository.create({ doctorCode: 'DOC02', userId: 'u2', branchId: 'b1', fullName: 'Dr. Inactive' });
    doctorRepository.doctors.get(doctor.id)!.isActive = false;

    await expect(
      validator.validate({ doctorId: doctor.id, patientId: 'p1', reservationDate: nextMonday(), reservationTime: parseTimeToDate('09:00') }),
    ).rejects.toBeInstanceOf(DoctorScheduleUnavailableException);
  });

  it('rejects a time outside any active schedule for that day', async () => {
    const { doctorRepository, scheduleRepository, validator } = buildSut();
    const doctor = await doctorRepository.create({ doctorCode: 'DOC03', userId: 'u3', branchId: 'b1', fullName: 'Dr. Schedule' });
    const monday = nextMonday();
    scheduleRepository.seed(buildDoctorSchedule({ doctorId: doctor.id, dayOfWeek: monday.getUTCDay() }));

    await expect(
      validator.validate({ doctorId: doctor.id, patientId: 'p1', reservationDate: monday, reservationTime: parseTimeToDate('18:00') }),
    ).rejects.toBeInstanceOf(DoctorScheduleUnavailableException);
  });

  it('rejects a fully-booked slot', async () => {
    const { doctorRepository, scheduleRepository, reservationRepository, validator } = buildSut();
    const doctor = await doctorRepository.create({ doctorCode: 'DOC04', userId: 'u4', branchId: 'b1', fullName: 'Dr. Full' });
    const monday = nextMonday();
    scheduleRepository.seed(buildDoctorSchedule({ doctorId: doctor.id, dayOfWeek: monday.getUTCDay(), maxPatient: 1 }));
    await reservationRepository.create({
      reservationNo: 'RSV-1',
      patientId: 'existing-patient',
      doctorId: doctor.id,
      branchId: 'b1',
      reservationDate: monday,
      reservationTime: parseTimeToDate('09:00'),
      reservationType: 'APPOINTMENT',
      source: 'PHONE',
      createdBy: 'staff-1',
    });

    await expect(
      validator.validate({ doctorId: doctor.id, patientId: 'new-patient', reservationDate: monday, reservationTime: parseTimeToDate('09:00') }),
    ).rejects.toBeInstanceOf(TimeSlotAlreadyReservedException);
  });

  it('rejects a patient with an existing active reservation the same day', async () => {
    const { doctorRepository, scheduleRepository, reservationRepository, validator } = buildSut();
    const doctor = await doctorRepository.create({ doctorCode: 'DOC05', userId: 'u5', branchId: 'b1', fullName: 'Dr. Conflict' });
    const monday = nextMonday();
    scheduleRepository.seed(buildDoctorSchedule({ doctorId: doctor.id, dayOfWeek: monday.getUTCDay(), maxPatient: 5 }));
    await reservationRepository.create({
      reservationNo: 'RSV-2',
      patientId: 'patient-1',
      doctorId: doctor.id,
      branchId: 'b1',
      reservationDate: monday,
      reservationTime: parseTimeToDate('09:00'),
      reservationType: 'APPOINTMENT',
      source: 'PHONE',
      createdBy: 'staff-1',
    });

    await expect(
      validator.validate({ doctorId: doctor.id, patientId: 'patient-1', reservationDate: monday, reservationTime: parseTimeToDate('09:30') }),
    ).rejects.toBeInstanceOf(PatientAlreadyHasActiveReservationException);
  });

  it('accepts a valid, available slot', async () => {
    const { doctorRepository, scheduleRepository, validator } = buildSut();
    const doctor = await doctorRepository.create({ doctorCode: 'DOC06', userId: 'u6', branchId: 'b1', fullName: 'Dr. Ok' });
    const monday = nextMonday();
    const seeded = buildDoctorSchedule({ doctorId: doctor.id, dayOfWeek: monday.getUTCDay() });
    scheduleRepository.seed(seeded);

    const result = await validator.validate({
      doctorId: doctor.id,
      patientId: 'patient-1',
      reservationDate: monday,
      reservationTime: parseTimeToDate('09:00'),
    });

    expect(result.id).toBe(seeded.id);
  });
});
