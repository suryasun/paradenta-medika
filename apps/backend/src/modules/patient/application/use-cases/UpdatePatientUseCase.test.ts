import { UpdatePatientUseCase } from './UpdatePatientUseCase';
import { FakePatientRepository, FakeEventBus } from '../../../../../tests/fakes/patientFakes';
import { FakeAuditService } from '../../../../../tests/fakes/authFakes';
import { PatientNotFoundException } from '../../domain/exceptions/PatientExceptions';

describe('UpdatePatientUseCase', () => {
  it('persists a valid update, leaves the Medical Record Number untouched, and audits', async () => {
    const patientRepository = new FakePatientRepository();
    const auditService = new FakeAuditService();
    const eventBus = new FakeEventBus();
    const patient = await patientRepository.create('MRN000001', {
      patientName: 'John Doe',
      gender: 'MALE',
      birthDate: new Date('1998-08-10'),
      phone: '08123456789',
      address: 'Jl. Contoh No. 10',
    });
    const useCase = new UpdatePatientUseCase(patientRepository, auditService, eventBus);

    const updated = await useCase.execute({
      patientId: patient.id,
      phoneNumber: '081298765432',
      actorUserId: 'staff-1',
    });

    expect(updated.phoneNumber).toBe('081298765432');
    expect(updated.medicalRecordNumber).toBe('MRN000001');
    expect(auditService.records).toHaveLength(1);
  });

  it('returns 404 for a non-existent patient', async () => {
    const patientRepository = new FakePatientRepository();
    const auditService = new FakeAuditService();
    const eventBus = new FakeEventBus();
    const useCase = new UpdatePatientUseCase(patientRepository, auditService, eventBus);

    await expect(useCase.execute({ patientId: 'missing', fullName: 'X', actorUserId: 'staff-1' })).rejects.toBeInstanceOf(
      PatientNotFoundException,
    );
  });
});
