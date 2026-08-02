import { Permission } from '@prisma/client';
import { ListQueryDto } from '../../../../shared/http/ListQueryDto';
import { PagedResult } from './IUserAdminRepository';

export interface IPermissionRepository {
  list(query: ListQueryDto): Promise<PagedResult<Permission>>;
  findByIds(ids: string[]): Promise<Permission[]>;
}
