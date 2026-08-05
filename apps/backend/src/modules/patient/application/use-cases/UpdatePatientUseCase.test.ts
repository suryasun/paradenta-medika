import { UpdatePatientUseCase } from './UpdatePatientUseCase';
import { FakePatientRepository, FakeEventBus } from '../../../../../tests/fakes/patientFakes';
import { FakeAuditService } from '../../../../../tests/fakes/authFakes';
import { FakeReferralSourceRepository } from '../../../../../tests/fakes/masterDataFakes';
import { PatientNotFoundException } from '../../domain/exceptions/PatientExceptions';

function buildSut() {
  const patientRepository = new FakePatientRepository();
  const auditService = new FakeAuditService();
  const eventBus = new FakeEventBus();
  const referralSourceRepository = new FakeReferralSourceRepository();
  const useCase = new UpdatePatientUseCase(patientRepository, auditService, eventBus, referralSourceRepository);
  return { patientRepository, auditService, eventBus, referralSourceRepository, useCase };
}

async function seedPatient(patientRepository: FakePatientRepository) {
  return patientRepository.create('MRN000001', {
    patientName: 'John Doe',
    gender: 'MALE',
    birthDate: new Date('1998-08-10'),
    phone: '08123456789',
    address: 'Jl. Contoh No. 10',
  });
}

describe('UpdatePatientUseCase', () => {
  it('persists a valid update, leaves the Medical Record Number untouched, and audits', async () => {
    const { patientRepository, auditService, useCase } = buildSut();
    const patient = await seedPatient(patientRepository);

    const updated = await useCase.execute({
      patientId: patient.id,
      phoneNumber: '081298765432',
      actorUserId: 'staff-1',
    });

    expect(updated.phoneNumber).toBe('081298765432');
    expect(updated.medicalRecordNumber).toBe('MRN000001');
    expect(auditService.records).toHaveLength(1);
  });

  it('persists the task-284 supplementary contact fields on update', async () => {
    const { patientRepository, useCase } = buildSut();
    const patient = await seedPatient(patientRepository);

    const updated = await useCase.execute({
      patientId: patient.id,
      insuranceNumber: 'INS-002',
      instagramHandle: '@jane',
      facebookHandle: 'jane.doe',
      tiktokHandle: '@jane.tiktok',
      whatsappNumber: '081298765432',
      actorUserId: 'staff-1',
    });

    expect(updated.insuranceNumber).toBe('INS-002');
    expect(updated.instagramHandle).toBe('@jane');
    expect(updated.facebookHandle).toBe('jane.doe');
    expect(updated.tiktokHandle).toBe('@jane.tiktok');
    expect(updated.whatsappNumber).toBe('081298765432');
  });

  it('persists a valid, active referralSourceId with or without referredByUserId', async () => {
    const { patientRepository, referralSourceRepository, useCase } = buildSut();
    const patient = await seedPatient(patientRepository);
    referralSourceRepository.items = [
      { id: 'src-1', referralSourceCode: 'STAFF', referralSourceName: 'Staf Klinik', requiresReferrer: true, isActive: true },
    ];

    const updated = await useCase.execute({ patientId: patient.id, referralSourceId: 'src-1', actorUserId: 'staff-1' });

    expect(updated.referralSourceId).toBe('src-1');
    expect(updated.referredByUserId).toBeNull();
  });

  it('rejects a nonexistent referralSourceId', async () => {
    const { patientRepository, useCase } = buildSut();
    const patient = await seedPatient(patientRepository);

    await expect(
      useCase.execute({ patientId: patient.id, referralSourceId: 'missing-source', actorUserId: 'staff-1' }),
    ).rejects.toMatchObject({ code: 'PATIENT_REFERRAL_SOURCE_INVALID' });
  });

  it('rejects an inactive referralSourceId', async () => {
    const { patientRepository, referralSourceRepository, useCase } = buildSut();
    const patient = await seedPatient(patientRepository);
    referralSourceRepository.items = [
      { id: 'src-2', referralSourceCode: 'OLD', referralSourceName: 'Discontinued Source', requiresReferrer: false, isActive: false },
    ];

    await expect(
      useCase.execute({ patientId: patient.id, referralSourceId: 'src-2', actorUserId: 'staff-1' }),
    ).rejects.toMatchObject({ code: 'PATIENT_REFERRAL_SOURCE_INVALID' });
  });

  it('returns 404 for a non-existent patient', async () => {
    const { useCase } = buildSut();

    await expect(useCase.execute({ patientId: 'missing', fullName: 'X', actorUserId: 'staff-1' })).rejects.toBeInstanceOf(
      PatientNotFoundException,
    );
  });
});
