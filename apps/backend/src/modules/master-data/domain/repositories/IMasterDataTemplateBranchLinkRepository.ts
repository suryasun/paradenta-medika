import { MasterDataTemplateBranchLink } from '@prisma/client';

export interface CreateMasterDataTemplateBranchLinkInput {
  templateId: string;
  branchId: string;
  pushedVersion: number;
  snapshotPayload: Record<string, unknown>;
  currentPayload: Record<string, unknown>;
  /** Phase 4 hardening: set when entityType is adapter-registered (see masterDataTemplateEntityAdapters.ts) -- the real Treatment/PaymentMethod/ToothCondition row's id. */
  appliedEntityId?: string;
}

export interface IMasterDataTemplateBranchLinkRepository {
  findByTemplateAndBranch(templateId: string, branchId: string): Promise<MasterDataTemplateBranchLink | null>;
  listByTemplate(templateId: string): Promise<MasterDataTemplateBranchLink[]>;
  create(input: CreateMasterDataTemplateBranchLinkInput): Promise<MasterDataTemplateBranchLink>;
  /** Re-pushes: overwrites both snapshotPayload and currentPayload with the template's current payload/version. `appliedEntityId` carries forward unchanged unless explicitly provided. */
  overwriteWithPush(id: string, pushedVersion: number, payload: Record<string, unknown>, appliedEntityId?: string): Promise<MasterDataTemplateBranchLink>;
  /** Phase 4 hardening: refreshes currentPayload from the entity adapter's live read, without changing pushedVersion/snapshotPayload (that's what "drift" means). */
  updateCurrentPayload(id: string, currentPayload: Record<string, unknown>): Promise<MasterDataTemplateBranchLink>;
}
