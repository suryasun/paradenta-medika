import { MasterDataTemplateBranchLink } from '@prisma/client';

export interface CreateMasterDataTemplateBranchLinkInput {
  templateId: string;
  branchId: string;
  pushedVersion: number;
  snapshotPayload: Record<string, unknown>;
  currentPayload: Record<string, unknown>;
}

export interface IMasterDataTemplateBranchLinkRepository {
  findByTemplateAndBranch(templateId: string, branchId: string): Promise<MasterDataTemplateBranchLink | null>;
  listByTemplate(templateId: string): Promise<MasterDataTemplateBranchLink[]>;
  create(input: CreateMasterDataTemplateBranchLinkInput): Promise<MasterDataTemplateBranchLink>;
  /** Re-pushes: overwrites both snapshotPayload and currentPayload with the template's current payload/version. */
  overwriteWithPush(id: string, pushedVersion: number, payload: Record<string, unknown>): Promise<MasterDataTemplateBranchLink>;
}
