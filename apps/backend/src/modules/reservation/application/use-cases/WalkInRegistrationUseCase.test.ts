import { WalkInRegistrationUseCase } from './WalkInRegistrationUseCase';
import { ReservationNumberGenerator } from '../services/ReservationNumberGenerator';
import { FakeDoctorRepository } from '../../../../../tests/fakes/masterDataFakes';
import { FakeReservationRepository } from '../../../../../tests/fakes/reservationFakes';
import { FakeAuditService } from '../../../../../tests/fakes/authFakes';
import { FakeEventBus, FakePatientRepository } from '../../../../../tests/fakes/patientFakes';

describe('WalkInRegistrationUseCase', () => {
  it("creates a reservation with type/source WALK_IN dated today", async () => {
    const reservationRepository = new FakeReservationRepository();
    const patientRepository = new FakePatientRepository();
    const doctorRepository = new FakeDoctorRepository();
    const reservationNumberGenerator = new ReservationNumberGenerator(reservationRepository);
    const auditService = new FakeAuditService();
    const eventBus = new FakeEventBus();
    const useCase = new WalkInRegistrationUseCase(reservationRepository, patientRepository, doctorRepository, reservationNumberGenerator, auditService, eventBus);

    const patient = await patientRepository.create('MRN000001', {
      patientName: 'Walk In Patient',
      gender: 'FEMALE',
      birthDate: new Date('1990-01-01'),
      phone: '0812',
      address: 'Jl. Walkin',
    });
    const doctor = await doctorRepository.create({ doctorCode: 'DOC01', userId: 'u1', branchId: 'branch-1', fullName: 'Dr. Walkin' });

    const result = await useCase.execute({ patientId: patient.id, doctorId: doctor.id, actorUserId: 'staff-1' });

    expect(result.reservationType).toBe('WALK_IN');
    expect(result.reservationSource).toBe('WALK_IN');
    expect(result.reservationDate).toBe(new Date().toISOString().slice(0, 10));
    expect(result.status).toBe('BOOKED');
  });
});
