import { IMasterDataTemplateRepository } from '../../domain/repositories/IMasterDataTemplateRepository';
import { IMasterDataTemplateBranchLinkRepository } from '../../domain/repositories/IMasterDataTemplateBranchLinkRepository';
import { MasterDataNotFoundException } from '../../domain/exceptions/MasterDataExceptions';

export interface FieldDrift {
  field: string;
  pushedValue: unknown;
  currentValue: unknown;
}

export interface BranchDriftEntry {
  branchId: string;
  pushedVersion: number;
  /** true when the template has been updated (version bumped) since this branch's last push. */
  isStale: boolean;
  /** field-by-field divergence between what was pushed (snapshotPayload) and the branch's live copy (currentPayload); empty when in sync. */
  fieldDrifts: FieldDrift[];
}

function diffPayloads(pushed: Record<string, unknown>, current: Record<string, unknown>): FieldDrift[] {
  const fields = new Set([...Object.keys(pushed), ...Object.keys(current)]);
  const drifts: FieldDrift[] = [];
  for (const field of fields) {
    if (JSON.stringify(pushed[field]) !== JSON.stringify(current[field])) {
      drifts.push({ field, pushedValue: pushed[field], currentValue: current[field] });
    }
  }
  return drifts;
}

/**
 * docs/06-tasks/task-223.md: "compares each pushed branch's current record
 * against the template's version at last push" -- i.e. currentPayload vs
 * snapshotPayload (task-222's PushMasterDataTemplateUseCase's own conflict
 * check, surfaced here field-by-field per the AC, not just a boolean).
 */
export class GetMasterDataDriftReportUseCase {
  constructor(
    private readonly templateRepository: IMasterDataTemplateRepository,
    private readonly branchLinkRepository: IMasterDataTemplateBranchLinkRepository,
  ) {}

  async execute(templateId: string): Promise<BranchDriftEntry[]> {
    const template = await this.templateRepository.findById(templateId);
    if (!template) {
      throw new MasterDataNotFoundException('MasterDataTemplate');
    }

    const links = await this.branchLinkRepository.listByTemplate(templateId);

    return links.map((link) => ({
      branchId: link.branchId,
      pushedVersion: link.pushedVersion,
      isStale: link.pushedVersion < template.version,
      fieldDrifts: diffPayloads(link.snapshotPayload as Record<string, unknown>, link.currentPayload as Record<string, unknown>),
    }));
  }
}
