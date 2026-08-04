import { Permission } from '@prisma/client';
import { IRoleRepository } from '../../domain/repositories/IRoleRepository';
import { IRolePermissionRepository } from '../../domain/repositories/IRolePermissionRepository';
import { RoleNotFoundException } from '../../domain/exceptions/SystemExceptions';

export class GetRolePermissionsUseCase {
  constructor(
    private readonly roleRepository: IRoleRepository,
    private readonly rolePermissionRepository: IRolePermissionRepository,
  ) {}

  async execute(roleId: string): Promise<Permission[]> {
    const role = await this.roleRepository.findById(roleId);
    if (!role) {
      throw new RoleNotFoundException();
    }
    return this.rolePermissionRepository.getPermissionsForRole(roleId);
  }
}
