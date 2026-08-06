import { MedicalRecordNumberGenerator } from './MedicalRecordNumberGenerator';
import { FakePatientRepository } from '../../../../../tests/fakes/patientFakes';
import { FakeBranchRepository } from '../../../../../tests/fakes/masterDataFakes';
import { BranchMrnPrefixNotConfiguredException } from '../../domain/exceptions/PatientExceptions';

function expectedMrn(prefix: string, sequence: number): string {
  const now = new Date();
  const yy = String(now.getUTCFullYear()).slice(-2);
  const mm = String(now.getUTCMonth() + 1).padStart(2, '0');
  return `${prefix}${yy}${mm}${String(sequence).padStart(3, '0')}`;
}

async function buildSut(mrnPrefix?: string) {
  const patientRepository = new FakePatientRepository();
  const branchRepository = new FakeBranchRepository();
  const branch = await branchRepository.create({
    clinicId: 'clinic-1',
    branchCode: 'BR-A',
    branchName: 'Branch A',
    phone: '021',
    email: 'a@x.com',
    address: 'Jl. A',
    mrnPrefix,
  });
  const generator = new MedicalRecordNumberGenerator(patientRepository, branchRepository);
  return { patientRepository, branchRepository, branch, generator };
}

// MRN scheme hardening (docs/03-sad/03-clean-architecture.md Section 41.3 --
// exact format left undefined beyond "MRN000001"): branch-prefixed,
// monthly-reset sequence, per explicit direction.
describe('MedicalRecordNumberGenerator', () => {
  it('generates {prefix}{YY}{MM}{00001} for the first patient of the month at a branch', async () => {
    const { branch, generator } = await buildSut('KM');

    const mrn = await generator.generate(branch.id);

    expect(mrn).toBe(expectedMrn('KM', 1));
  });

  it('increments the sequence once a patient has actually been persisted at that branch this month', async () => {
    const { patientRepository, branch, generator } = await buildSut('KM');
    const first = await generator.generate(branch.id);
    await patientRepository.create(first, {
      patientName: 'Patient One',
      gender: 'MALE',
      birthDate: new Date('1990-01-01'),
      phone: '0811',
      address: 'Jl. X',
      registeredBranchId: branch.id,
    });

    const second = await generator.generate(branch.id);

    expect(second).toBe(expectedMrn('KM', 2));
  });

  it('never proposes an MRN that is already taken -- re-checks against findByMRN even if the base count is stale', async () => {
    const { patientRepository, branch, generator } = await buildSut('KM');
    // A patient exists with the "sequence 1" MRN but the branch's monthly
    // count is still 0 (e.g. seeded directly, not via generate()) --
    // the re-check loop must still skip past it.
    await patientRepository.create(expectedMrn('KM', 1), {
      patientName: 'Existing',
      gender: 'MALE',
      birthDate: new Date('1990-01-01'),
      phone: '0811',
      address: 'Jl. X',
    });

    const mrn = await generator.generate(branch.id);

    expect(mrn).toBe(expectedMrn('KM', 2));
  });

  it('scopes the monthly sequence per branch -- a different branch starts its own count at 1', async () => {
    const { patientRepository, branch: branchA, generator: generatorA } = await buildSut('KM');
    await patientRepository.create(expectedMrn('KM', 1), {
      patientName: 'Patient at Branch A',
      gender: 'MALE',
      birthDate: new Date('1990-01-01'),
      phone: '0811',
      address: 'Jl. X',
      registeredBranchId: branchA.id,
    });

    const branchRepositoryB = new FakeBranchRepository();
    const branchB = await branchRepositoryB.create({
      clinicId: 'clinic-1',
      branchCode: 'BR-B',
      branchName: 'Branch B',
      phone: '021',
      email: 'b@x.com',
      address: 'Jl. B',
      mrnPrefix: 'BS',
    });
    const generatorB = new MedicalRecordNumberGenerator(patientRepository, branchRepositoryB);

    const mrnAtBranchB = await generatorB.generate(branchB.id);

    expect(mrnAtBranchB).toBe(expectedMrn('BS', 1));
    void generatorA;
  });

  it('rejects generation for a branch with no mrnPrefix configured', async () => {
    const { branch, generator } = await buildSut(undefined);

    await expect(generator.generate(branch.id)).rejects.toBeInstanceOf(BranchMrnPrefixNotConfiguredException);
  });

  it('rejects generation for a nonexistent branchId', async () => {
    const { generator } = await buildSut('KM');

    await expect(generator.generate('missing-branch')).rejects.toBeInstanceOf(BranchMrnPrefixNotConfiguredException);
  });
});
