import { FeatureFlag } from '@prisma/client';
import { PagedResult } from '../../../../shared/http/pagination';
import { IFeatureFlagRepository } from '../../domain/repositories/IFeatureFlagRepository';
import { ListFeatureFlagQueryDto } from '../dtos/ApprovalWorkflowQueryDto';

export class ListFeatureFlagsUseCase {
  constructor(private readonly featureFlagRepository: IFeatureFlagRepository) {}

  async execute(query: ListFeatureFlagQueryDto): Promise<PagedResult<FeatureFlag>> {
    return this.featureFlagRepository.list(query, { ownerModule: query.ownerModule });
  }
}
