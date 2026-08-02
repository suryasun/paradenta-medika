import { Permission } from '@prisma/client';
import { ListQueryDto } from '../../../../shared/http/ListQueryDto';
import { IPermissionRepository } from '../../domain/repositories/IPermissionRepository';
import { PagedResult } from '../../domain/repositories/IUserAdminRepository';

export class ListPermissionsUseCase {
  constructor(private readonly permissionRepository: IPermissionRepository) {}

  async execute(query: ListQueryDto): Promise<PagedResult<Permission>> {
    return this.permissionRepository.list(query);
  }
}
