import { Prisma, MasterDataTemplateBranchLink } from '@prisma/client';
import { prisma } from '../../../../shared/infrastructure/prisma';
import {
  CreateMasterDataTemplateBranchLinkInput,
  IMasterDataTemplateBranchLinkRepository,
} from '../../domain/repositories/IMasterDataTemplateBranchLinkRepository';

export class MasterDataTemplateBranchLinkRepository implements IMasterDataTemplateBranchLinkRepository {
  async findByTemplateAndBranch(templateId: string, branchId: string): Promise<MasterDataTemplateBranchLink | null> {
    return prisma.masterDataTemplateBranchLink.findUnique({ where: { templateId_branchId: { templateId, branchId } } });
  }

  async listByTemplate(templateId: string): Promise<MasterDataTemplateBranchLink[]> {
    return prisma.masterDataTemplateBranchLink.findMany({ where: { templateId } });
  }

  async create(input: CreateMasterDataTemplateBranchLinkInput): Promise<MasterDataTemplateBranchLink> {
    return prisma.masterDataTemplateBranchLink.create({
      data: {
        templateId: input.templateId,
        branchId: input.branchId,
        pushedVersion: input.pushedVersion,
        snapshotPayload: input.snapshotPayload as Prisma.InputJsonValue,
        currentPayload: input.currentPayload as Prisma.InputJsonValue,
        appliedEntityId: input.appliedEntityId,
      },
    });
  }

  async overwriteWithPush(
    id: string,
    pushedVersion: number,
    payload: Record<string, unknown>,
    appliedEntityId?: string,
  ): Promise<MasterDataTemplateBranchLink> {
    return prisma.masterDataTemplateBranchLink.update({
      where: { id },
      data: {
        pushedVersion,
        snapshotPayload: payload as Prisma.InputJsonValue,
        currentPayload: payload as Prisma.InputJsonValue,
        appliedEntityId: appliedEntityId ?? undefined,
      },
    });
  }

  async updateCurrentPayload(id: string, currentPayload: Record<string, unknown>): Promise<MasterDataTemplateBranchLink> {
    return prisma.masterDataTemplateBranchLink.update({
      where: { id },
      data: { currentPayload: currentPayload as Prisma.InputJsonValue },
    });
  }
}
