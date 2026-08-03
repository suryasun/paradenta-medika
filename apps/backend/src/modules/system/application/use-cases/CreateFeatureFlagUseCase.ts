import { FeatureFlag } from '@prisma/client';
import { IFeatureFlagRepository } from '../../domain/repositories/IFeatureFlagRepository';
import { AuditContext, IAuditService } from '../../domain/services/IAuditService';
import { FeatureFlagKeyExistsException, FlagAuthBypassForbiddenException, FlagReviewDateRequiredException } from '../../domain/exceptions/SystemExceptions';
import { CreateFeatureFlagRequestDto } from '../dtos/FeatureFlagRequestDto';

/**
 * docs/06-tasks/task-205.md AC: "SYS_FLAG_AUTH_BYPASS_FORBIDDEN enforced
 * at creation/update. Critical flags require an expiry/review date."
 * The real guarantee ("enabling a flag only exposes a capability to
 * users who already pass its API/domain permission") is architectural --
 * no code path in this codebase lets a feature flag substitute for a
 * permission check. This keyword screen on the flag's own metadata is a
 * best-effort additional safety net at definition time, not the sole
 * enforcement mechanism (the SAD gives no concrete detection algorithm).
 */
const AUTH_BYPASS_KEYWORDS = ['bypass', 'skip-permission', 'skip-auth', 'grant-access', 'no-auth', 'ignore-permission'];

export function assertNoAuthBypassIntent(...texts: Array<string | undefined>): void {
  const haystack = texts.filter(Boolean).join(' ').toLowerCase();
  if (AUTH_BYPASS_KEYWORDS.some((keyword) => haystack.includes(keyword))) {
    throw new FlagAuthBypassForbiddenException();
  }
}

export class CreateFeatureFlagUseCase {
  constructor(
    private readonly featureFlagRepository: IFeatureFlagRepository,
    private readonly auditService: IAuditService,
  ) {}

  async execute(input: CreateFeatureFlagRequestDto, actorUserId: string, auditContext: AuditContext): Promise<FeatureFlag> {
    assertNoAuthBypassIntent(input.targetScope, input.description);
    if (input.riskClass === 'critical' && !input.reviewDate) {
      throw new FlagReviewDateRequiredException();
    }

    const existing = await this.featureFlagRepository.findByKey(input.flagKey);
    if (existing) {
      throw new FeatureFlagKeyExistsException();
    }

    const flag = await this.featureFlagRepository.create({
      flagKey: input.flagKey,
      ownerModule: input.ownerModule,
      targetScope: input.targetScope,
      enabled: input.enabled,
      riskClass: input.riskClass,
      effectiveFrom: input.effectiveFrom ? new Date(input.effectiveFrom) : undefined,
      effectiveUntil: input.effectiveUntil ? new Date(input.effectiveUntil) : undefined,
      reviewDate: input.reviewDate ? new Date(input.reviewDate) : undefined,
      description: input.description,
      createdBy: actorUserId,
    });

    await this.auditService.record('FeatureFlag', flag.id, 'CREATE', null, { flagKey: flag.flagKey, enabled: flag.enabled }, auditContext);

    return flag;
  }
}
