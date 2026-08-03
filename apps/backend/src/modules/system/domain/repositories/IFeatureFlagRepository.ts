import { FeatureFlag } from '@prisma/client';
import { ListQueryDto } from '../../../../shared/http/ListQueryDto';
import { PagedResult } from '../../../../shared/http/pagination';

export interface CreateFeatureFlagInput {
  flagKey: string;
  ownerModule: string;
  targetScope?: string;
  enabled?: boolean;
  riskClass?: string;
  effectiveFrom?: Date;
  effectiveUntil?: Date;
  reviewDate?: Date;
  description?: string;
  createdBy: string;
}

export interface UpdateFeatureFlagInput {
  targetScope?: string;
  enabled?: boolean;
  effectiveFrom?: Date;
  effectiveUntil?: Date;
  reviewDate?: Date;
  description?: string;
  updatedBy: string;
}

export interface FeatureFlagListFilter {
  ownerModule?: string;
  enabled?: boolean;
}

export interface IFeatureFlagRepository {
  create(input: CreateFeatureFlagInput): Promise<FeatureFlag>;
  list(query: ListQueryDto, filter: FeatureFlagListFilter): Promise<PagedResult<FeatureFlag>>;
  findByKey(flagKey: string): Promise<FeatureFlag | null>;
  update(flagKey: string, input: UpdateFeatureFlagInput): Promise<FeatureFlag>;
}
