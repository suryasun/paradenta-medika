import { Role } from '@prisma/client';
import { ListQueryDto } from '../../../../shared/http/ListQueryDto';
import { PagedResult } from './IUserAdminRepository';

export interface CreateRoleInput {
  roleCode: string;
  roleName: string;
  description?: string;
}

export interface IRoleRepository {
  create(input: CreateRoleInput): Promise<Role>;
  list(query: ListQueryDto): Promise<PagedResult<Role>>;
  findById(id: string): Promise<Role | null>;
  findByCode(roleCode: string): Promise<Role | null>;
  /** docs/06-tasks/task-217.md: flips a role's cross-branch policy; task-216's guard reads Role.isCrossBranch fresh on every request, so no cache invalidation is needed. */
  updateBranchPolicy(id: string, isCrossBranch: boolean): Promise<Role>;
}
