import { Role } from '@prisma/client';
import { ListQueryDto } from '../../../../shared/http/ListQueryDto';
import { IRoleRepository } from '../../domain/repositories/IRoleRepository';
import { PagedResult } from '../../domain/repositories/IUserAdminRepository';

export class ListRolesUseCase {
  constructor(private readonly roleRepository: IRoleRepository) {}

  async execute(query: ListQueryDto): Promise<PagedResult<Role>> {
    return this.roleRepository.list(query);
  }
}
