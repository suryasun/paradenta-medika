import { AuditContext, IAuditService } from '../../../system/domain/services/IAuditService';
import { IMasterDataTemplateRepository } from '../../domain/repositories/IMasterDataTemplateRepository';
import { IMasterDataTemplateBranchLinkRepository } from '../../domain/repositories/IMasterDataTemplateBranchLinkRepository';
import { IBranchRepository } from '../../domain/repositories/IBranchRepository';
import { MasterDataNotFoundException, MasterDataReferenceInvalidException } from '../../domain/exceptions/MasterDataExceptions';

export interface PushMasterDataTemplateInput {
  templateId: string;
  branchIds: string[];
  actorUserId: string;
  ipAddress?: string;
  correlationId?: string;
}

export type PushResultStatus = 'CREATED' | 'UPDATED' | 'CONFLICT';

export interface PushMasterDataTemplateResult {
  branchId: string;
  status: PushResultStatus;
}

function deepEqual(a: Record<string, unknown>, b: Record<string, unknown>): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

/**
 * docs/06-tasks/task-222.md: for each target branch, creates the
 * branch-scoped link if absent, or updates it if the branch's currentPayload
 * hasn't diverged from what was last pushed (currentPayload === snapshotPayload);
 * a diverged branch is flagged CONFLICT and left untouched rather than
 * silently overwritten, matching the AC. One conflicting branch does not
 * block the push to the other requested branches.
 */
export class PushMasterDataTemplateUseCase {
  constructor(
    private readonly templateRepository: IMasterDataTemplateRepository,
    private readonly branchLinkRepository: IMasterDataTemplateBranchLinkRepository,
    private readonly branchRepository: IBranchRepository,
    private readonly auditService: IAuditService,
  ) {}

  async execute(input: PushMasterDataTemplateInput): Promise<PushMasterDataTemplateResult[]> {
    const template = await this.templateRepository.findById(input.templateId);
    if (!template) {
      throw new MasterDataNotFoundException('MasterDataTemplate');
    }

    const templatePayload = template.templatePayload as Record<string, unknown>;
    const results: PushMasterDataTemplateResult[] = [];

    for (const branchId of input.branchIds) {
      const branch = await this.branchRepository.findById(branchId);
      if (!branch) {
        throw new MasterDataReferenceInvalidException(`Referenced Branch ${branchId} does not exist`);
      }

      const existingLink = await this.branchLinkRepository.findByTemplateAndBranch(input.templateId, branchId);
      if (!existingLink) {
        await this.branchLinkRepository.create({
          templateId: input.templateId,
          branchId,
          pushedVersion: template.version,
          snapshotPayload: templatePayload,
          currentPayload: templatePayload,
        });
        results.push({ branchId, status: 'CREATED' });
        continue;
      }

      const hasLocalDivergence = !deepEqual(
        existingLink.currentPayload as Record<string, unknown>,
        existingLink.snapshotPayload as Record<string, unknown>,
      );
      if (hasLocalDivergence) {
        results.push({ branchId, status: 'CONFLICT' });
        continue;
      }

      await this.branchLinkRepository.overwriteWithPush(existingLink.id, template.version, templatePayload);
      results.push({ branchId, status: 'UPDATED' });
    }

    const auditContext: AuditContext = { userId: input.actorUserId, ipAddress: input.ipAddress, correlationId: input.correlationId };
    await this.auditService.record(
      'MasterDataTemplate',
      input.templateId,
      'UPDATE',
      null,
      { action: 'PUSH', results },
      auditContext,
    );

    return results;
  }
}
