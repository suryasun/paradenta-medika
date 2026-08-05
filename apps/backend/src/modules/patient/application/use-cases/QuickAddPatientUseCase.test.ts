import { QuickAddPatientUseCase } from './QuickAddPatientUseCase';
import { MedicalRecordNumberGenerator } from '../services/MedicalRecordNumberGenerator';
import { FakePatientRepository, FakeEventBus } from '../../../../../tests/fakes/patientFakes';
import { FakeAuditService } from '../../../../../tests/fakes/authFakes';
import { DuplicateIdentityException } from '../../domain/exceptions/PatientExceptions';
import { PATIENT_REGISTERED_EVENT } from '../../domain/events/PatientEvents';

function buildSut() {
  const patientRepository = new FakePatientRepository();
  const mrnGenerator = new MedicalRecordNumberGenerator(patientRepository);
  const auditService = new FakeAuditService();
  const eventBus = new FakeEventBus();
  const useCase = new QuickAddPatientUseCase(patientRepository, mrnGenerator, auditService, eventBus);
  return { patientRepository, auditService, eventBus, useCase };
}

function validInput(overrides: Partial<Parameters<QuickAddPatientUseCase['execute']>[0]> = {}) {
  return {
    fullName: 'Walk-in Patient',
    address: 'Jl. Contoh No. 99',
    phoneNumber: '08129998877',
    identityNumber: '3171000000000001',
    actorUserId: 'staff-1',
    ...overrides,
  };
}

describe('QuickAddPatientUseCase', () => {
  it('registers a patient with exactly the 4 required fields, a real MRN, and ACTIVE status', async () => {
    const { auditService, eventBus, useCase } = buildSut();

    const result = await useCase.execute(validInput());

    expect(result.medicalRecordNumber).toBe('MRN000001');
    expect(result.fullName).toBe('Walk-in Patient');
    expect(result.status).toBe('ACTIVE');
    expect(auditService.records).toHaveLength(1);
    expect(eventBus.published).toHaveLength(1);
    expect(eventBus.published[0].eventName).toBe(PATIENT_REGISTERED_EVENT);
  });

  it('applies the same duplicate-identity check as full registration (reuses findByIdentityNumber)', async () => {
    const { useCase } = buildSut();
    await useCase.execute(validInput());

    await expect(useCase.execute(validInput({ fullName: 'Another Patient' }))).rejects.toBeInstanceOf(
      DuplicateIdentityException,
    );
  });

  it('produces a fully real record that UpdatePatientUseCase can complete later with no special-casing', async () => {
    const { patientRepository, useCase } = buildSut();
    const result = await useCase.execute(validInput());

    const updated = await patientRepository.update(result.id, {
      gender: 'MALE',
      birthDate: new Date('1990-01-01'),
    });

    expect(updated.gender).toBe('MALE');
    expect(updated.birthDate).toEqual(new Date('1990-01-01'));
  });
});
