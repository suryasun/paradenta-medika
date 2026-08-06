import { IUserRoleRepository } from '../../../system/domain/repositories/IUserRoleRepository';
import { IUserBranchRepository } from '../../../system/domain/repositories/IUserBranchRepository';
import { IDoctorRepository } from '../../../master-data/domain/repositories/IDoctorRepository';

export interface QueueScope {
  allowedBranchIds?: string[];
  restrictToDoctorId?: string;
}

export interface ResolveQueueScopeDeps {
  userRoleRepository: IUserRoleRepository;
  userBranchRepository: IUserBranchRepository;
  doctorRepository: IDoctorRepository;
}

const DOCTOR_ROLE_CODE = 'DOCTOR';

/**
 * docs/06-tasks/task-311.md/task-312.md: resolves the caller's Queue
 * visibility scope from their real UserBranch assignments and (for the
 * Doctor role) their own Doctor record, mirroring branchScopeGuard.ts's
 * per-request lookup pattern but producing a real narrowing filter instead
 * of only rejecting an explicit out-of-scope target.
 *
 * A sentinel, unmatchable doctor id is used when a Doctor-role user has no
 * linked Doctor profile, so their board resolves to an empty result set
 * rather than throwing or silently falling back to unrestricted access.
 */
const NO_DOCTOR_PROFILE_SENTINEL = '00000000-0000-0000-0000-000000000000';

export async function resolveQueueScope(
  userId: string,
  roleCodes: string[],
  deps: ResolveQueueScopeDeps,
): Promise<QueueScope> {
  const scope: QueueScope = {};

  const roles = await deps.userRoleRepository.listRolesForUser(userId);
  const isCrossBranch = roles.some((role) => role.isCrossBranch);
  if (!isCrossBranch) {
    const assignments = await deps.userBranchRepository.listForUser(userId);
    scope.allowedBranchIds = assignments.map((assignment) => assignment.branchId);
  }

  if (roleCodes.includes(DOCTOR_ROLE_CODE)) {
    const doctor = await deps.doctorRepository.findByUserId(userId);
    scope.restrictToDoctorId = doctor?.id ?? NO_DOCTOR_PROFILE_SENTINEL;
  }

  return scope;
}
