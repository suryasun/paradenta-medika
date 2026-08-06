import { resolveQueueScope } from './resolveQueueScope';
import { FakeRoleRepository, FakeUserRoleRepository, FakeUserBranchRepository, buildRole } from '../../../../../tests/fakes/systemFakes';
import { FakeDoctorRepository } from '../../../../../tests/fakes/masterDataFakes';

function buildDeps() {
  const roleRepository = new FakeRoleRepository();
  const userRoleRepository = new FakeUserRoleRepository(roleRepository);
  const userBranchRepository = new FakeUserBranchRepository();
  const doctorRepository = new FakeDoctorRepository();
  return { roleRepository, userRoleRepository, userBranchRepository, doctorRepository };
}

// docs/06-tasks/task-311.md/task-312.md
describe('resolveQueueScope', () => {
  it('does not restrict branches for a cross-branch role', async () => {
    const { roleRepository, userRoleRepository, userBranchRepository, doctorRepository } = buildDeps();
    const role = buildRole({ roleCode: 'ADMINISTRATOR', isCrossBranch: true });
    roleRepository.seed(role);
    await userRoleRepository.assignRoles('user-1', [role.id]);

    const scope = await resolveQueueScope('user-1', ['ADMINISTRATOR'], { userRoleRepository, userBranchRepository, doctorRepository });

    expect(scope.allowedBranchIds).toBeUndefined();
    expect(scope.restrictToDoctorId).toBeUndefined();
  });

  it('narrows to the user\'s assigned branches for a non-cross-branch role', async () => {
    const { roleRepository, userRoleRepository, userBranchRepository, doctorRepository } = buildDeps();
    const role = buildRole({ roleCode: 'REGISTRATION', isCrossBranch: false });
    roleRepository.seed(role);
    await userRoleRepository.assignRoles('user-1', [role.id]);
    await userBranchRepository.replaceAssignments('user-1', [{ branchId: 'branch-a', isDefault: true }], 'admin');

    const scope = await resolveQueueScope('user-1', ['REGISTRATION'], { userRoleRepository, userBranchRepository, doctorRepository });

    expect(scope.allowedBranchIds).toEqual(['branch-a']);
    expect(scope.restrictToDoctorId).toBeUndefined();
  });

  it('resolves restrictToDoctorId for the Doctor role from the user\'s own Doctor record', async () => {
    const { roleRepository, userRoleRepository, userBranchRepository, doctorRepository } = buildDeps();
    const role = buildRole({ roleCode: 'DOCTOR', isCrossBranch: false });
    roleRepository.seed(role);
    await userRoleRepository.assignRoles('user-1', [role.id]);
    const doctor = await doctorRepository.create({
      doctorCode: 'DOC01', userId: 'user-1', branchId: 'branch-a', fullName: 'Dr. Amelia',
    });

    const scope = await resolveQueueScope('user-1', ['DOCTOR'], { userRoleRepository, userBranchRepository, doctorRepository });

    expect(scope.restrictToDoctorId).toBe(doctor.id);
  });

  it('resolves an unmatchable sentinel doctor id when a Doctor-role user has no linked Doctor record', async () => {
    const { userRoleRepository, userBranchRepository, doctorRepository } = buildDeps();

    const scope = await resolveQueueScope('user-without-doctor', ['DOCTOR'], { userRoleRepository, userBranchRepository, doctorRepository });

    expect(scope.restrictToDoctorId).toBeDefined();
    expect(scope.restrictToDoctorId).not.toBe('');
  });
});
