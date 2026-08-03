import { ActivityLog, AuditLog, Notification, NotificationTemplate, Permission, Role, User } from '@prisma/client';
import {
  CreateNotificationTemplateInput,
  INotificationTemplateRepository,
  NotificationTemplateListFilter,
} from '../../src/modules/system/domain/repositories/INotificationTemplateRepository';
import {
  CreateNotificationInput,
  INotificationRepository,
  NotificationListFilter,
} from '../../src/modules/system/domain/repositories/INotificationRepository';
import {
  INotificationProviderAdapter,
  NotificationDeliveryRequest,
  NotificationDeliveryResult,
} from '../../src/modules/system/domain/services/INotificationProviderAdapter';
import { CreateUserAdminInput, IUserAdminRepository, PagedResult } from '../../src/modules/system/domain/repositories/IUserAdminRepository';
import { CreateRoleInput, IRoleRepository } from '../../src/modules/system/domain/repositories/IRoleRepository';
import { IPermissionRepository } from '../../src/modules/system/domain/repositories/IPermissionRepository';
import { IRolePermissionRepository } from '../../src/modules/system/domain/repositories/IRolePermissionRepository';
import { IUserRoleRepository } from '../../src/modules/system/domain/repositories/IUserRoleRepository';
import { AuditLogFilter, IAuditLogRepository } from '../../src/modules/system/domain/repositories/IAuditLogRepository';
import { ActivityLogFilter, IActivityLogRepository } from '../../src/modules/system/domain/repositories/IActivityLogRepository';
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

export class FakeAuditLogRepository implements IAuditLogRepository {
  logs: AuditLog[] = [];

  async query(query: ListQueryDto, filter: AuditLogFilter): Promise<PagedResult<AuditLog>> {
    const filtered = this.logs.filter(
      (log) =>
        (!filter.actorUserId || log.userId === filter.actorUserId) &&
        (!filter.entity || log.entity === filter.entity) &&
        (!filter.entityId || log.entityId === filter.entityId) &&
        (!filter.action || log.action === filter.action) &&
        (!filter.correlationId || log.correlationId === filter.correlationId) &&
        (!filter.dateFrom || log.createdAt.getTime() >= filter.dateFrom.getTime()) &&
        (!filter.dateTo || log.createdAt.getTime() <= filter.dateTo.getTime()),
    );
    return paginate(filtered, query);
  }
}

export class FakeActivityLogRepository implements IActivityLogRepository {
  logs: ActivityLog[] = [];

  async query(query: ListQueryDto, filter: ActivityLogFilter): Promise<PagedResult<ActivityLog>> {
    const filtered = this.logs.filter(
      (log) =>
        (!filter.module || log.module === filter.module) &&
        (!filter.actorUserId || log.actorUserId === filter.actorUserId) &&
        (!filter.branchId || log.branchId === filter.branchId) &&
        (!filter.action || log.action === filter.action) &&
        (!filter.dateFrom || log.createdAt.getTime() >= filter.dateFrom.getTime()) &&
        (!filter.dateTo || log.createdAt.getTime() <= filter.dateTo.getTime()),
    );
    return paginate(filtered, query);
  }
}

export class FakeNotificationTemplateRepository implements INotificationTemplateRepository {
  templates = new Map<string, NotificationTemplate>();

  async create(input: CreateNotificationTemplateInput): Promise<NotificationTemplate> {
    const existingVersions = [...this.templates.values()].filter((t) => t.templateKey === input.templateKey);
    const version = existingVersions.length ? Math.max(...existingVersions.map((t) => t.version)) + 1 : 1;
    const template: NotificationTemplate = {
      id: nextId('tpl'),
      templateKey: input.templateKey,
      channel: input.channel,
      locale: input.locale,
      subject: input.subject ?? null,
      body: input.body,
      variableSchema: input.variableSchema as never,
      classification: input.classification ?? 'internal',
      version,
      isActive: true,
      createdAt: new Date(),
      createdBy: input.createdBy,
    } as NotificationTemplate;
    this.templates.set(template.id, template);
    return template;
  }

  async list(query: ListQueryDto, filter: NotificationTemplateListFilter): Promise<PagedResult<NotificationTemplate>> {
    const filtered = [...this.templates.values()].filter(
      (t) =>
        (!filter.templateKey || t.templateKey === filter.templateKey) &&
        (!filter.channel || t.channel === filter.channel) &&
        (filter.isActive === undefined || t.isActive === filter.isActive),
    );
    return paginate(filtered, query);
  }

  async findById(id: string): Promise<NotificationTemplate | null> {
    return this.templates.get(id) ?? null;
  }

  async findLatestActiveByKey(templateKey: string): Promise<NotificationTemplate | null> {
    const versions = [...this.templates.values()].filter((t) => t.templateKey === templateKey && t.isActive);
    if (!versions.length) return null;
    return versions.reduce((latest, t) => (t.version > latest.version ? t : latest));
  }
}

export class FakeNotificationRepository implements INotificationRepository {
  notifications = new Map<string, Notification>();

  async create(input: CreateNotificationInput): Promise<Notification> {
    const notification: Notification = {
      id: nextId('notif'),
      recipientUserId: input.recipientUserId,
      templateId: input.templateId ?? null,
      channel: input.channel,
      subject: input.subject ?? null,
      message: input.message,
      status: 'QUEUED',
      idempotencyKey: input.idempotencyKey,
      attempts: 0,
      lastError: null,
      sentAt: null,
      readAt: null,
      createdAt: new Date(),
    } as Notification;
    this.notifications.set(notification.id, notification);
    return notification;
  }

  async findById(id: string): Promise<Notification | null> {
    return this.notifications.get(id) ?? null;
  }

  async findByIdempotencyKey(idempotencyKey: string): Promise<Notification | null> {
    return [...this.notifications.values()].find((n) => n.idempotencyKey === idempotencyKey) ?? null;
  }

  async list(query: ListQueryDto, filter: NotificationListFilter): Promise<PagedResult<Notification>> {
    const filtered = [...this.notifications.values()].filter(
      (n) => n.recipientUserId === filter.recipientUserId && (!filter.status || n.status === filter.status),
    );
    return paginate(filtered, query);
  }

  async markStatus(
    id: string,
    status: Notification['status'],
    fields?: { attempts?: number; lastError?: string | null; sentAt?: Date; readAt?: Date },
  ): Promise<Notification> {
    const notification = this.notifications.get(id);
    if (!notification) throw new Error('not found');
    notification.status = status;
    if (fields?.attempts !== undefined) notification.attempts = fields.attempts;
    if (fields?.lastError !== undefined) notification.lastError = fields.lastError;
    if (fields?.sentAt) notification.sentAt = fields.sentAt;
    if (fields?.readAt) notification.readAt = fields.readAt;
    return notification;
  }
}

export class FakeNotificationProviderAdapter implements INotificationProviderAdapter {
  shouldFail = false;
  sent: NotificationDeliveryRequest[] = [];

  async send(request: NotificationDeliveryRequest): Promise<NotificationDeliveryResult> {
    this.sent.push(request);
    if (this.shouldFail) {
      return { success: false, errorSafeMessage: 'Simulated provider failure' };
    }
    return { success: true };
  }
}
