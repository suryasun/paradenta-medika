import { SystemParameter } from '@prisma/client';
import { ISystemParameterRepository } from '../../domain/repositories/ISystemParameterRepository';
import { IBranchRepository } from '../../../master-data/domain/repositories/IBranchRepository';
import { MasterDataNotFoundException } from '../../../master-data/domain/exceptions/MasterDataExceptions';

export interface BranchConfigurationEntry {
  key: string;
  value: string;
  valueType: SystemParameter['valueType'];
  source: 'BRANCH' | 'GLOBAL';
}

/**
 * docs/06-tasks/task-213.md: aggregates a branch's effective configuration
 * -- every branch-scoped parameter override, plus every clinic-level
 * (GLOBAL, see ResolveDefaultBranchUseCase's scope note) parameter not
 * overridden at branch level -- distinguishing which source each entry
 * came from per the task's own Acceptance Criteria.
 */
export class GetBranchConfigurationUseCase {
  constructor(
    private readonly branchRepository: IBranchRepository,
    private readonly systemParameterRepository: ISystemParameterRepository,
  ) {}

  async execute(branchId: string): Promise<BranchConfigurationEntry[]> {
    const branch = await this.branchRepository.findById(branchId);
    if (!branch) {
      throw new MasterDataNotFoundException('Branch');
    }

    const [branchParameters, globalParameters] = await Promise.all([
      this.systemParameterRepository.listLatestByScope('BRANCH', branchId),
      this.systemParameterRepository.listLatestByScope('GLOBAL'),
    ]);

    const branchKeys = new Set(branchParameters.map((p) => p.key));
    const entries: BranchConfigurationEntry[] = branchParameters.map((p) => ({
      key: p.key,
      value: p.value,
      valueType: p.valueType,
      source: 'BRANCH' as const,
    }));

    for (const parameter of globalParameters) {
      if (!branchKeys.has(parameter.key)) {
        entries.push({ key: parameter.key, value: parameter.value, valueType: parameter.valueType, source: 'GLOBAL' });
      }
    }

    return entries;
  }
}
