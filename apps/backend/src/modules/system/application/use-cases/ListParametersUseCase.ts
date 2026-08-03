import { SystemParameter } from '@prisma/client';
import { PagedResult } from '../../../../shared/http/pagination';
import { ISystemParameterRepository } from '../../domain/repositories/ISystemParameterRepository';
import { ListSystemParameterQueryDto } from '../dtos/ApprovalWorkflowQueryDto';

export class ListParametersUseCase {
  constructor(private readonly systemParameterRepository: ISystemParameterRepository) {}

  async execute(query: ListSystemParameterQueryDto): Promise<PagedResult<SystemParameter>> {
    return this.systemParameterRepository.list(query, { key: query.key, scopeType: query.scopeType, scopeId: query.scopeId });
  }
}
