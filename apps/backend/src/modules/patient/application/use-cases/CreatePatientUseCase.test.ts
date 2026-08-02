import { CreatePatientUseCase } from './CreatePatientUseCase';
import { MedicalRecordNumberGenerator } from '../services/MedicalRecordNumberGenerator';
import { FakePatientRepository, FakeEventBus } from '../../../../../tests/fakes/patientFakes';
import { FakeAuditService } from '../../../../../tests/fakes/authFakes';
import { DuplicateIdentityException, InvalidDateOfBirthException } from '../../domain/exceptions/PatientExceptions';
import { ValidationException } from '../../../../shared/http/exceptions';
import { PATIENT_REGISTERED_EVENT } from '../../domain/events/PatientEvents';

function buildSut() {
  const patientRepository = new FakePatientRepository();
  const mrnGenerator = new MedicalRecordNumberGenerator(patientRepository);
  const auditService = new FakeAuditService();
  const eventBus = new FakeEventBus();
  const useCase = new CreatePatientUseCase(patientRepository, mrnGenerator, auditService, eventBus);
  return { patientRepository, auditService, eventBus, useCase };
}

function validInput(overrides: Partial<Parameters<CreatePatientUseCase['execute']>[0]> = {}) {
  return {
    fullName: 'John Doe',
    gender: 'MALE' as const,
    dateOfBirth: '1998-08-10',
    phoneNumber: '08123456789',
    address: 'Jl. Contoh No. 10',
    actorUserId: 'staff-1',
    ...overrides,
  };
}

describe('CreatePatientUseCase', () => {
  it('registers a patient, generates an MRN, publishes PatientRegistered, and audits', async () => {
    const { auditService, eventBus, useCase } = buildSut();

    const result = await useCase.execute(validInput());

    expect(result.medicalRecordNumber).toBe('MRN000001');
    expect(result.fullName).toBe('John Doe');
    expect(result.status).toBe('ACTIVE');
    expect(auditService.records).toHaveLength(1);
    expect(eventBus.published).toHaveLength(1);
    expect(eventBus.published[0].eventName).toBe(PATIENT_REGISTERED_EVENT);
  });

  it('rejects a date of birth in the future', async () => {
    const { useCase } = buildSut();
    const future = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    await expect(useCase.execute(validInput({ dateOfBirth: future }))).rejects.toBeInstanceOf(InvalidDateOfBirthException);
  });

  it('rejects identityNumber provided without identityType', async () => {
    const { useCase } = buildSut();

    await expect(useCase.execute(validInput({ identityNumber: '3171234567890001' }))).rejects.toBeInstanceOf(
      ValidationException,
    );
  });

  it('rejects a duplicate identity number for the same identity type', async () => {
    const { useCase } = buildSut();
    await useCase.execute(validInput({ identityType: 'KTP', identityNumber: '3171234567890001' }));

    await expect(
      useCase.execute(validInput({ fullName: 'Jane Doe', identityType: 'KTP', identityNumber: '3171234567890001' })),
    ).rejects.toBeInstanceOf(DuplicateIdentityException);
  });

  it('generates sequential MRNs for successive registrations', async () => {
    const { useCase } = buildSut();
    const first = await useCase.execute(validInput());
    const second = await useCase.execute(validInput({ fullName: 'Jane Doe' }));

    expect(first.medicalRecordNumber).toBe('MRN000001');
    expect(second.medicalRecordNumber).toBe('MRN000002');
  });
});
