import { SystemParameter } from '@prisma/client';
import { PagedResult } from '../../../../shared/http/pagination';
import { ISystemParameterRepository } from '../../domain/repositories/ISystemParameterRepository';
import { ListQueryDto } from '../../../../shared/http/ListQueryDto';

/** docs/06-tasks/task-201.md AC: "Versions are strictly ordered and immutable" -- ordered by version desc; rows are append-only, never updated. */
export class ListParameterVersionsUseCase {
  constructor(private readonly systemParameterRepository: ISystemParameterRepository) {}

  async execute(key: string, query: ListQueryDto): Promise<PagedResult<SystemParameter>> {
    return this.systemParameterRepository.findVersions(key, query);
  }
}
