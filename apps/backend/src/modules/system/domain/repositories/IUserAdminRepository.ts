import { User } from '@prisma/client';
import { ListQueryDto } from '../../../../shared/http/ListQueryDto';

export interface CreateUserAdminInput {
  username: string;
  email: string;
  passwordHash: string;
}

export interface PagedResult<T> {
  items: T[];
  total: number;
}

/**
 * System Administration's view of the `users` table (docs/06-tasks/task-015.md,
 * task-016.md). Shares the same table as modules/auth's IUserRepository:
 * per docs/03-sad/06-database-design.md Section 18, Authentication and
 * System Administration are one bounded context ("System Module"), not two
 * separate ones -- this interface covers the admin-facing operations
 * (create/list/update-profile/activate/deactivate) while modules/auth's
 * IUserRepository covers the login/session-facing operations.
 */
export interface UserAdminListFilter {
  /** docs/06-tasks/task-214.md: restricts results to users assigned to one of these branches. */
  branchIds?: string[];
}

export interface IUserAdminRepository {
  create(input: CreateUserAdminInput): Promise<User>;
  list(query: ListQueryDto, filter?: UserAdminListFilter): Promise<PagedResult<User>>;
  findById(id: string): Promise<User | null>;
  existsByUsernameOrEmail(username: string, email: string, excludeUserId?: string): Promise<boolean>;
  updateEmail(id: string, email: string): Promise<User>;
  setStatus(id: string, status: 'ACTIVE' | 'INACTIVE'): Promise<User>;
}
