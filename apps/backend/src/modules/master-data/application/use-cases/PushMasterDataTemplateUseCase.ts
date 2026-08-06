import { AuditContext, IAuditService } from '../../../system/domain/services/IAuditService';
import { IMasterDataTemplateRepository } from '../../domain/repositories/IMasterDataTemplateRepository';
import { IMasterDataTemplateBranchLinkRepository } from '../../domain/repositories/IMasterDataTemplateBranchLinkRepository';
import { IBranchRepository } from '../../domain/repositories/IBranchRepository';
import { MasterDataNotFoundException, MasterDataReferenceInvalidException } from '../../domain/exceptions/MasterDataExceptions';
import { IMasterDataTemplateEntityAdapter } from '../services/IMasterDataTemplateEntityAdapter';

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
  /** Phase 4 hardening: true when entityType is adapter-registered and this push actually wrote to the real Treatment/PaymentMethod/ToothCondition row (false for CONFLICT, or for any unregistered entityType -- JSON-only as before). */
  appliedToEntity: boolean;
  appliedEntityId?: string;
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
    // Phase 4 hardening: entityType -> real-entity adapter, keyed by the
    // literal strings TREATMENT/PAYMENT_METHOD/TOOTH_CONDITION (see
    // masterDataTemplateEntityAdapters.ts). Any other entityType (or no
    // registry at all, for callers/tests that don't need it) keeps the
    // pre-existing JSON-only behavior unchanged.
    private readonly entityAdapters?: Map<string, IMasterDataTemplateEntityAdapter>,
  ) {}

  async execute(input: PushMasterDataTemplateInput): Promise<PushMasterDataTemplateResult[]> {
    const template = await this.templateRepository.findById(input.templateId);
    if (!template) {
      throw new MasterDataNotFoundException('MasterDataTemplate');
    }

    const templatePayload = template.templatePayload as Record<string, unknown>;
    const adapter = this.entityAdapters?.get(template.entityType);
    const results: PushMasterDataTemplateResult[] = [];

    for (const branchId of input.branchIds) {
      const branch = await this.branchRepository.findById(branchId);
      if (!branch) {
        throw new MasterDataReferenceInvalidException(`Referenced Branch ${branchId} does not exist`);
      }

      const existingLink = await this.branchLinkRepository.findByTemplateAndBranch(input.templateId, branchId);
      if (!existingLink) {
        const applied = await adapter?.applyToEntity(branchId, templatePayload);
        await this.branchLinkRepository.create({
          templateId: input.templateId,
          branchId,
          pushedVersion: template.version,
          snapshotPayload: templatePayload,
          currentPayload: templatePayload,
          appliedEntityId: applied?.entityId,
        });
        results.push({ branchId, status: 'CREATED', appliedToEntity: !!applied, appliedEntityId: applied?.entityId });
        continue;
      }

      const hasLocalDivergence = !deepEqual(
        existingLink.currentPayload as Record<string, unknown>,
        existingLink.snapshotPayload as Record<string, unknown>,
      );
      if (hasLocalDivergence) {
        results.push({ branchId, status: 'CONFLICT', appliedToEntity: false });
        continue;
      }

      const applied = await adapter?.applyToEntity(branchId, templatePayload);
      await this.branchLinkRepository.overwriteWithPush(existingLink.id, template.version, templatePayload, applied?.entityId ?? existingLink.appliedEntityId ?? undefined);
      results.push({ branchId, status: 'UPDATED', appliedToEntity: !!applied, appliedEntityId: applied?.entityId ?? existingLink.appliedEntityId ?? undefined });
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
