import { CreateQueueUseCase } from './CreateQueueUseCase';
import { QueueNumberGenerator } from '../services/QueueNumberGenerator';
import { FakeQueueRepository } from '../../../../../tests/fakes/queueFakes';
import { FakeDoctorRepository } from '../../../../../tests/fakes/masterDataFakes';
import { FakePatientRepository, FakeEventBus } from '../../../../../tests/fakes/patientFakes';
import { FakeAuditService } from '../../../../../tests/fakes/authFakes';
import { PatientAlreadyHasActiveQueueException } from '../../domain/exceptions/QueueExceptions';

function buildSut() {
  const queueRepository = new FakeQueueRepository();
  const patientRepository = new FakePatientRepository();
  const doctorRepository = new FakeDoctorRepository();
  const queueNumberGenerator = new QueueNumberGenerator(queueRepository);
  const auditService = new FakeAuditService();
  const eventBus = new FakeEventBus();
  const useCase = new CreateQueueUseCase(queueRepository, patientRepository, doctorRepository, queueNumberGenerator, auditService, eventBus);
  return { queueRepository, patientRepository, doctorRepository, auditService, eventBus, useCase };
}

async function seedPatient(repo: FakePatientRepository) {
  return repo.create('MRN000001', {
    patientName: 'John Doe',
    gender: 'MALE',
    birthDate: new Date('1998-08-10'),
    phone: '0812',
    address: 'Jl. Contoh',
  });
}

describe('CreateQueueUseCase', () => {
  it('creates a queue entry with a unique, sequential, correctly-formatted queue number and WAITING status', async () => {
    const { queueRepository, patientRepository, doctorRepository, useCase } = buildSut();
    const patient1 = await seedPatient(patientRepository);
    const patient2 = await patientRepository.create('MRN000002', {
      patientName: 'Jane Doe',
      gender: 'FEMALE',
      birthDate: new Date('1995-01-01'),
      phone: '0813',
      address: 'Jl. Lain',
    });
    const doctor = await doctorRepository.create({ doctorCode: 'DOC01', userId: 'u1', branchId: 'branch-1', fullName: 'Dr. Test' });

    const first = await useCase.execute({ patientId: patient1.id, doctorId: doctor.id, actorUserId: 'staff-1' });
    const second = await useCase.execute({ patientId: patient2.id, doctorId: doctor.id, actorUserId: 'staff-1' });

    expect(first.queueNumber).toBe('A001');
    expect(second.queueNumber).toBe('A002');
    expect(first.status).toBe('WAITING');
    expect(queueRepository.queues.size).toBe(2);
  });

  it('rejects a second active queue for the same patient/branch/day', async () => {
    const { patientRepository, doctorRepository, useCase } = buildSut();
    const patient = await seedPatient(patientRepository);
    const doctor = await doctorRepository.create({ doctorCode: 'DOC02', userId: 'u2', branchId: 'branch-1', fullName: 'Dr. Test' });

    await useCase.execute({ patientId: patient.id, doctorId: doctor.id, actorUserId: 'staff-1' });

    await expect(useCase.execute({ patientId: patient.id, doctorId: doctor.id, actorUserId: 'staff-1' })).rejects.toBeInstanceOf(
      PatientAlreadyHasActiveQueueException,
    );
  });
});
