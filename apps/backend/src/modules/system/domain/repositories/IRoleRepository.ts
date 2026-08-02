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
}
