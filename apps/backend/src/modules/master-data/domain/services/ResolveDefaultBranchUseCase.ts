import { IUserBranchRepository } from '../../../system/domain/repositories/IUserBranchRepository';
import { ISystemParameterRepository } from '../../../system/domain/repositories/ISystemParameterRepository';
import { NoDefaultBranchConfiguredException } from '../exceptions/MasterDataExceptions';

/** docs/03-sad/11-module-master-data.md Section 11.2: "Default Branch ditentukan melalui System Parameter." */
export const DEFAULT_BRANCH_PARAMETER_KEY = 'masterdata.branch.default';

/**
 * docs/06-tasks/task-212.md: shared domain service resolving which branch
 * applies when a branch-scoped request omits an explicit branchId.
 *
 * Consumes System module repository interfaces directly (IUserBranchRepository,
 * ISystemParameterRepository) -- a Repository Interface is a sanctioned
 * cross-module channel per docs/04-ai-contract/07-module-contract.md MOD-003,
 * the same precedent already used for task-225's cross-module checks.
 *
 * Scope note: docs/03-sad/21-module-system.md Section 3.4 describes a
 * three-tier `branch -> clinic -> global` parameter precedence, but this
 * codebase's actual SystemParameter implementation (task-200/202) only
 * wires two scope types, `GLOBAL` and `BRANCH` (see
 * ApprovalWorkflowQueryDto's `@IsIn(['GLOBAL', 'BRANCH'])`) -- there is no
 * CLINIC scope type anywhere else in the system. task-212's "clinic-level
 * default" therefore resolves against scopeType `GLOBAL`, the top of this
 * codebase's actual precedence chain, rather than inventing a new,
 * unwired CLINIC scope tier.
 */
export class ResolveDefaultBranchUseCase {
  constructor(
    private readonly userBranchRepository: IUserBranchRepository,
    private readonly systemParameterRepository: ISystemParameterRepository,
  ) {}

  async execute(userId: string): Promise<string> {
    const userBranches = await this.userBranchRepository.listForUser(userId);
    const userDefault = userBranches.find((assignment) => assignment.isDefault);
    if (userDefault) {
      return userDefault.branchId;
    }

    const clinicDefault = await this.systemParameterRepository.findLatest(DEFAULT_BRANCH_PARAMETER_KEY, 'GLOBAL');
    if (clinicDefault) {
      return clinicDefault.value;
    }

    throw new NoDefaultBranchConfiguredException();
  }
}
