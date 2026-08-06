import { CreatePatientUseCase } from './CreatePatientUseCase';
import { MedicalRecordNumberGenerator } from '../services/MedicalRecordNumberGenerator';
import { FakePatientRepository, FakeEventBus } from '../../../../../tests/fakes/patientFakes';
import { FakeAuditService } from '../../../../../tests/fakes/authFakes';
import { FakeReferralSourceRepository, FakeBranchRepository } from '../../../../../tests/fakes/masterDataFakes';
import { FakeUserBranchRepository, FakeSystemParameterRepository } from '../../../../../tests/fakes/systemFakes';
import { ResolveDefaultBranchUseCase } from '../../../master-data/domain/services/ResolveDefaultBranchUseCase';
import { DuplicateIdentityException, InvalidDateOfBirthException } from '../../domain/exceptions/PatientExceptions';
import { ValidationException } from '../../../../shared/http/exceptions';
import { PATIENT_REGISTERED_EVENT } from '../../domain/events/PatientEvents';

// MRN scheme hardening: branch-prefixed, monthly-reset -- expectations
// below compute the current YY/MM the same way MedicalRecordNumberGenerator
// does, rather than hardcoding a value that goes stale next month.
function expectedMrn(prefix: string, sequence: number): string {
  const now = new Date();
  const yy = String(now.getUTCFullYear()).slice(-2);
  const mm = String(now.getUTCMonth() + 1).padStart(2, '0');
  return `${prefix}${yy}${mm}${String(sequence).padStart(3, '0')}`;
}

async function buildSut() {
  const patientRepository = new FakePatientRepository();
  const branchRepository = new FakeBranchRepository();
  const branch = await branchRepository.create({
    clinicId: 'clinic-1',
    branchCode: 'BR-A',
    branchName: 'Branch A',
    phone: '021',
    email: 'a@x.com',
    address: 'Jl. A',
    mrnPrefix: 'KM',
  });
  const mrnGenerator = new MedicalRecordNumberGenerator(patientRepository, branchRepository);
  const auditService = new FakeAuditService();
  const eventBus = new FakeEventBus();
  const referralSourceRepository = new FakeReferralSourceRepository();
  const userBranchRepository = new FakeUserBranchRepository();
  await userBranchRepository.replaceAssignments('staff-1', [{ branchId: branch.id, isDefault: true }], 'admin-1');
  const resolveDefaultBranchUseCase = new ResolveDefaultBranchUseCase(userBranchRepository, new FakeSystemParameterRepository());
  const useCase = new CreatePatientUseCase(
    patientRepository,
    mrnGenerator,
    auditService,
    eventBus,
    referralSourceRepository,
    resolveDefaultBranchUseCase,
  );
  return { patientRepository, auditService, eventBus, referralSourceRepository, branch, useCase };
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
  it('registers a patient, generates a branch-prefixed MRN, publishes PatientRegistered, and audits', async () => {
    const { auditService, eventBus, branch, useCase } = await buildSut();

    const result = await useCase.execute(validInput());

    expect(result.medicalRecordNumber).toBe(expectedMrn('KM', 1));
    expect(result.registeredBranchId).toBe(branch.id);
    expect(result.fullName).toBe('John Doe');
    expect(result.status).toBe('ACTIVE');
    expect(auditService.records).toHaveLength(1);
    expect(eventBus.published).toHaveLength(1);
    expect(eventBus.published[0].eventName).toBe(PATIENT_REGISTERED_EVENT);
  });

  it('rejects a date of birth in the future', async () => {
    const { useCase } = await buildSut();
    const future = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    await expect(useCase.execute(validInput({ dateOfBirth: future }))).rejects.toBeInstanceOf(InvalidDateOfBirthException);
  });

  it('rejects identityNumber provided without identityType', async () => {
    const { useCase } = await buildSut();

    await expect(useCase.execute(validInput({ identityNumber: '3171234567890001' }))).rejects.toBeInstanceOf(
      ValidationException,
    );
  });

  it('rejects a duplicate identity number for the same identity type', async () => {
    const { useCase } = await buildSut();
    await useCase.execute(validInput({ identityType: 'KTP', identityNumber: '3171234567890001' }));

    await expect(
      useCase.execute(validInput({ fullName: 'Jane Doe', identityType: 'KTP', identityNumber: '3171234567890001' })),
    ).rejects.toBeInstanceOf(DuplicateIdentityException);
  });

  it('registers a patient with the task-284 supplementary contact fields', async () => {
    const { useCase } = await buildSut();

    const result = await useCase.execute(
      validInput({
        insuranceNumber: 'INS-001',
        instagramHandle: '@johndoe',
        facebookHandle: 'john.doe',
        tiktokHandle: '@johndoe.tiktok',
        whatsappNumber: '08123456789',
      }),
    );

    expect(result.insuranceNumber).toBe('INS-001');
    expect(result.instagramHandle).toBe('@johndoe');
    expect(result.facebookHandle).toBe('john.doe');
    expect(result.tiktokHandle).toBe('@johndoe.tiktok');
    expect(result.whatsappNumber).toBe('08123456789');
  });

  it('registers a patient with a valid, active referralSourceId, with or without referredByUserId', async () => {
    const { useCase, referralSourceRepository } = await buildSut();
    referralSourceRepository.items = [
      { id: 'src-1', referralSourceCode: 'STAFF', referralSourceName: 'Staf Klinik', requiresReferrer: true, isActive: true },
    ];

    const result = await useCase.execute(validInput({ referralSourceId: 'src-1' }));

    expect(result.referralSourceId).toBe('src-1');
    expect(result.referredByUserId).toBeNull();
  });

  it('never requires referredByUserId even when the selected source has requiresReferrer:true', async () => {
    const { useCase, referralSourceRepository } = await buildSut();
    referralSourceRepository.items = [
      { id: 'src-1', referralSourceCode: 'STAFF', referralSourceName: 'Staf Klinik', requiresReferrer: true, isActive: true },
    ];

    await expect(useCase.execute(validInput({ referralSourceId: 'src-1', referredByUserId: undefined }))).resolves.toBeDefined();
  });

  it('rejects a nonexistent referralSourceId', async () => {
    const { useCase } = await buildSut();

    await expect(useCase.execute(validInput({ referralSourceId: 'missing-source' }))).rejects.toMatchObject({
      code: 'PATIENT_REFERRAL_SOURCE_INVALID',
    });
  });

  it('rejects an inactive referralSourceId', async () => {
    const { useCase, referralSourceRepository } = await buildSut();
    referralSourceRepository.items = [
      { id: 'src-2', referralSourceCode: 'OLD', referralSourceName: 'Discontinued Source', requiresReferrer: false, isActive: false },
    ];

    await expect(useCase.execute(validInput({ referralSourceId: 'src-2' }))).rejects.toMatchObject({
      code: 'PATIENT_REFERRAL_SOURCE_INVALID',
    });
  });

  it('registers a patient successfully when none of the task-284 supplementary contact fields are provided', async () => {
    const { useCase } = await buildSut();

    const result = await useCase.execute(validInput());

    expect(result.insuranceNumber).toBeNull();
    expect(result.instagramHandle).toBeNull();
    expect(result.facebookHandle).toBeNull();
    expect(result.tiktokHandle).toBeNull();
    expect(result.whatsappNumber).toBeNull();
  });

  it('generates sequential, branch-scoped MRNs for successive registrations', async () => {
    const { useCase } = await buildSut();
    const first = await useCase.execute(validInput());
    const second = await useCase.execute(validInput({ fullName: 'Jane Doe' }));

    expect(first.medicalRecordNumber).toBe(expectedMrn('KM', 1));
    expect(second.medicalRecordNumber).toBe(expectedMrn('KM', 2));
  });

  it('rejects registration when the resolved branch has no mrnPrefix configured', async () => {
    const patientRepository = new FakePatientRepository();
    const branchRepository = new FakeBranchRepository();
    const branchNoPrefix = await branchRepository.create({
      clinicId: 'clinic-1',
      branchCode: 'BR-B',
      branchName: 'Branch B',
      phone: '021',
      email: 'b@x.com',
      address: 'Jl. B',
    });
    const mrnGenerator = new MedicalRecordNumberGenerator(patientRepository, branchRepository);
    const userBranchRepository = new FakeUserBranchRepository();
    await userBranchRepository.replaceAssignments('staff-2', [{ branchId: branchNoPrefix.id, isDefault: true }], 'admin-1');
    const resolveDefaultBranchUseCase = new ResolveDefaultBranchUseCase(userBranchRepository, new FakeSystemParameterRepository());
    const useCase = new CreatePatientUseCase(
      patientRepository,
      mrnGenerator,
      new FakeAuditService(),
      new FakeEventBus(),
      new FakeReferralSourceRepository(),
      resolveDefaultBranchUseCase,
    );

    await expect(useCase.execute(validInput({ actorUserId: 'staff-2' }))).rejects.toMatchObject({
      code: 'PAT_BRANCH_MRN_PREFIX_MISSING',
    });
  });
});
