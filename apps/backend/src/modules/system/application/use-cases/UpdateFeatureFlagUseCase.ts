import { FeatureFlag } from '@prisma/client';
import { IFeatureFlagRepository } from '../../domain/repositories/IFeatureFlagRepository';
import { AuditContext, IAuditService } from '../../domain/services/IAuditService';
import { FeatureFlagNotFoundException, FlagReviewDateRequiredException } from '../../domain/exceptions/SystemExceptions';
import { assertNoAuthBypassIntent } from './CreateFeatureFlagUseCase';
import { UpdateFeatureFlagRequestDto } from '../dtos/FeatureFlagRequestDto';

export class UpdateFeatureFlagUseCase {
  constructor(
    private readonly featureFlagRepository: IFeatureFlagRepository,
    private readonly auditService: IAuditService,
  ) {}

  async execute(flagKey: string, input: UpdateFeatureFlagRequestDto, actorUserId: string, auditContext: AuditContext): Promise<FeatureFlag> {
    const existing = await this.featureFlagRepository.findByKey(flagKey);
    if (!existing) {
      throw new FeatureFlagNotFoundException();
    }
    assertNoAuthBypassIntent(input.targetScope, input.description);
    const reviewDate = input.reviewDate ? new Date(input.reviewDate) : existing.reviewDate;
    if (existing.riskClass === 'critical' && !reviewDate) {
      throw new FlagReviewDateRequiredException();
    }

    const updated = await this.featureFlagRepository.update(flagKey, {
      targetScope: input.targetScope,
      enabled: input.enabled,
      effectiveFrom: input.effectiveFrom ? new Date(input.effectiveFrom) : undefined,
      effectiveUntil: input.effectiveUntil ? new Date(input.effectiveUntil) : undefined,
      reviewDate: input.reviewDate ? new Date(input.reviewDate) : undefined,
      description: input.description,
      updatedBy: actorUserId,
    });

    await this.auditService.record('FeatureFlag', updated.id, 'UPDATE', { enabled: existing.enabled }, { enabled: updated.enabled }, auditContext);

    return updated;
  }
}
