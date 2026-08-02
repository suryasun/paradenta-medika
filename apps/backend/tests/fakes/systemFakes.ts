import { Permission, Role, User } from '@prisma/client';
import { CreateUserAdminInput, IUserAdminRepository, PagedResult } from '../../src/modules/system/domain/repositories/IUserAdminRepository';
import { CreateRoleInput, IRoleRepository } from '../../src/modules/system/domain/repositories/IRoleRepository';
import { IPermissionRepository } from '../../src/modules/system/domain/repositories/IPermissionRepository';
import { IRolePermissionRepository } from '../../src/modules/system/domain/repositories/IRolePermissionRepository';
import { IUserRoleRepository } from '../../src/modules/system/domain/repositories/IUserRoleRepository';
import { ListQueryDto } from '../../src/shared/http/ListQueryDto';
import { nextFakeUuid } from './uuid';

function nextId(_prefix: string): string {
  return nextFakeUuid();
}

function paginate<T>(items: T[], query: ListQueryDto): PagedResult<T> {
  const start = (query.page - 1) * query.limit;
  return { items: items.slice(start, start + query.limit), total: items.length };
}

export class FakeUserAdminRepository implements IUserAdminRepository {
  users = new Map<string, User>();

  seed(user: User): void {
    this.users.set(user.id, user);
  }

  async create(input: CreateUserAdminInput): Promise<User> {
    const user: User = {
      id: nextId('user'),
      username: input.username,
      email: input.email,
      passwordHash: input.passwordHash,
      status: 'ACTIVE',
      lastLoginAt: null,
      failedLoginCount: 0,
      lockedUntil: null,
      requirePasswordReset: false,
      createdAt: new Date(),
      createdBy: null,
      updatedAt: new Date(),
      updatedBy: null,
      deletedAt: null,
      deletedBy: null,
    };
    this.users.set(user.id, user);
    return user;
  }

  async list(query: ListQueryDto): Promise<PagedResult<User>> {
    return paginate([...this.users.values()], query);
  }

  async findById(id: string): Promise<User | null> {
    return this.users.get(id) ?? null;
  }

  async existsByUsernameOrEmail(username: string, email: string, excludeUserId?: string): Promise<boolean> {
    return [...this.users.values()].some(
      (u) => (u.username === username || u.email === email) && u.id !== excludeUserId,
    );
  }

  async updateEmail(id: string, email: string): Promise<User> {
    const user = this.users.get(id);
    if (!user) throw new Error('not found');
    user.email = email;
    return user;
  }

  async setStatus(id: string, status: 'ACTIVE' | 'INACTIVE'): Promise<User> {
    const user = this.users.get(id);
    if (!user) throw new Error('not found');
    user.status = status;
    return user;
  }
}

export class FakeRoleRepository implements IRoleRepository {
  roles = new Map<string, Role>();

  seed(role: Role): void {
    this.roles.set(role.id, role);
  }

  async create(input: CreateRoleInput): Promise<Role> {
    const role: Role = {
      id: nextId('role'),
      roleCode: input.roleCode,
      roleName: input.roleName,
      description: input.description ?? null,
      isSystem: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.roles.set(role.id, role);
    return role;
  }

  async list(query: ListQueryDto): Promise<PagedResult<Role>> {
    return paginate([...this.roles.values()], query);
  }

  async findById(id: string): Promise<Role | null> {
    return this.roles.get(id) ?? null;
  }

  async findByCode(roleCode: string): Promise<Role | null> {
    return [...this.roles.values()].find((r) => r.roleCode === roleCode) ?? null;
  }
}

export class FakePermissionRepository implements IPermissionRepository {
  permissions = new Map<string, Permission>();

  seed(permission: Permission): void {
    this.permissions.set(permission.id, permission);
  }

  async list(query: ListQueryDto): Promise<PagedResult<Permission>> {
    return paginate([...this.permissions.values()], query);
  }

  async findByIds(ids: string[]): Promise<Permission[]> {
    return ids.map((id) => this.permissions.get(id)).filter((p): p is Permission => Boolean(p));
  }
}

export class FakeRolePermissionRepository implements IRolePermissionRepository {
  assignments = new Map<string, string[]>();

  constructor(private readonly permissionRepository: FakePermissionRepository) {}

  async replacePermissionsForRole(roleId: string, permissionIds: string[]): Promise<void> {
    this.assignments.set(roleId, permissionIds);
  }

  async getPermissionsForRole(roleId: string): Promise<Permission[]> {
    const ids = this.assignments.get(roleId) ?? [];
    return ids.map((id) => this.permissionRepository.permissions.get(id)).filter((p): p is Permission => Boolean(p));
  }
}

export class FakeUserRoleRepository implements IUserRoleRepository {
  assignments = new Map<string, Set<string>>();

  constructor(private readonly roleRepository: FakeRoleRepository) {}

  async assignRoles(userId: string, roleIds: string[]): Promise<void> {
    const existing = this.assignments.get(userId) ?? new Set<string>();
    roleIds.forEach((id) => existing.add(id));
    this.assignments.set(userId, existing);
  }

  async listRolesForUser(userId: string): Promise<Role[]> {
    const ids = this.assignments.get(userId) ?? new Set<string>();
    return [...ids].map((id) => this.roleRepository.roles.get(id)).filter((r): r is Role => Boolean(r));
  }
}

export function buildRole(overrides: Partial<Role> = {}): Role {
  return {
    id: nextId('role'),
    roleCode: 'CASHIER',
    roleName: 'Cashier',
    description: null,
    isSystem: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

export function buildPermission(overrides: Partial<Permission> = {}): Permission {
  return {
    id: nextId('perm'),
    module: 'billing',
    permissionKey: 'billing.payment',
    permissionName: 'Take Payment',
    description: null,
    ...overrides,
  };
}
