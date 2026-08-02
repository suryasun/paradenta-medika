import { PasswordResetToken, User, UserSession, UserStatus } from '@prisma/client';
import { AuditAction, AuditContext, IAuditService } from '../../src/modules/system/domain/services/IAuditService';
import { IPasswordResetTokenRepository } from '../../src/modules/auth/domain/repositories/IPasswordResetTokenRepository';
import { ISessionRepository, CreateSessionInput } from '../../src/modules/auth/domain/repositories/ISessionRepository';
import { IUserRepository, UserRoleWithPermissions } from '../../src/modules/auth/domain/repositories/IUserRepository';
import { nextFakeUuid } from './uuid';

function nextId(_prefix: string): string {
  return nextFakeUuid();
}

export function buildUser(overrides: Partial<User> = {}): User {
  return {
    id: nextId('user'),
    username: 'jdoe',
    email: 'jdoe@example.com',
    passwordHash: 'hash',
    status: 'ACTIVE' as UserStatus,
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
    ...overrides,
  };
}

export class FakeUserRepository implements IUserRepository {
  users = new Map<string, User>();
  roles = new Map<string, UserRoleWithPermissions[]>();

  seed(user: User, roles: UserRoleWithPermissions[] = [{ roleCode: 'REGISTRATION', roleName: 'Registration', permissionKeys: ['patient.create'] }]): void {
    this.users.set(user.id, user);
    this.roles.set(user.id, roles);
  }

  async findByIdentifier(identifier: string): Promise<User | null> {
    return [...this.users.values()].find((u) => u.username === identifier || u.email === identifier) ?? null;
  }

  async findById(id: string): Promise<User | null> {
    return this.users.get(id) ?? null;
  }

  async findByEmail(email: string): Promise<User | null> {
    return [...this.users.values()].find((u) => u.email === email) ?? null;
  }

  async getRolesWithPermissions(userId: string): Promise<UserRoleWithPermissions[]> {
    return this.roles.get(userId) ?? [];
  }

  async incrementFailedLoginCount(userId: string): Promise<number> {
    const user = this.users.get(userId);
    if (!user) throw new Error('not found');
    user.failedLoginCount += 1;
    return user.failedLoginCount;
  }

  async resetFailedLoginCount(userId: string): Promise<void> {
    const user = this.users.get(userId);
    if (user) {
      user.failedLoginCount = 0;
      user.lockedUntil = null;
    }
  }

  async lockUntil(userId: string, until: Date): Promise<void> {
    const user = this.users.get(userId);
    if (user) user.lockedUntil = until;
  }

  async setRequirePasswordReset(userId: string, required: boolean): Promise<void> {
    const user = this.users.get(userId);
    if (user) user.requirePasswordReset = required;
  }

  async updateLastLoginAt(userId: string): Promise<void> {
    const user = this.users.get(userId);
    if (user) user.lastLoginAt = new Date();
  }

  async updatePasswordHash(userId: string, passwordHash: string): Promise<void> {
    const user = this.users.get(userId);
    if (user) user.passwordHash = passwordHash;
  }
}

export class FakeSessionRepository implements ISessionRepository {
  sessions = new Map<string, UserSession>();

  async create(input: CreateSessionInput): Promise<UserSession> {
    const session: UserSession = {
      id: nextId('session'),
      userId: input.userId,
      deviceId: input.deviceId ?? null,
      deviceName: input.deviceName ?? null,
      deviceType: input.deviceType ?? null,
      browser: input.browser ?? null,
      ipAddress: input.ipAddress ?? null,
      refreshTokenHash: input.refreshTokenHash,
      previousRefreshTokenHash: null,
      expiredAt: input.expiredAt,
      lastUsedAt: null,
      revokedAt: null,
      createdAt: new Date(),
    };
    this.sessions.set(session.id, session);
    return session;
  }

  async findById(id: string): Promise<UserSession | null> {
    return this.sessions.get(id) ?? null;
  }

  async findActiveByRefreshTokenHash(refreshTokenHash: string): Promise<UserSession | null> {
    return [...this.sessions.values()].find((s) => s.refreshTokenHash === refreshTokenHash && !s.revokedAt) ?? null;
  }

  async findByPreviousRefreshTokenHash(refreshTokenHash: string): Promise<UserSession | null> {
    return [...this.sessions.values()].find((s) => s.previousRefreshTokenHash === refreshTokenHash) ?? null;
  }

  async rotateRefreshToken(sessionId: string, currentHash: string, newRefreshTokenHash: string, newExpiredAt: Date): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) return;
    session.previousRefreshTokenHash = currentHash;
    session.refreshTokenHash = newRefreshTokenHash;
    session.expiredAt = newExpiredAt;
    session.lastUsedAt = new Date();
  }

  async revoke(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (session) session.revokedAt = new Date();
  }

  async revokeAllForUser(userId: string): Promise<void> {
    for (const session of this.sessions.values()) {
      if (session.userId === userId && !session.revokedAt) {
        session.revokedAt = new Date();
      }
    }
  }

  async touchLastUsed(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (session) session.lastUsedAt = new Date();
  }
}

export class FakePasswordResetTokenRepository implements IPasswordResetTokenRepository {
  tokens = new Map<string, PasswordResetToken>();

  async create(userId: string, tokenHash: string, expiredAt: Date): Promise<PasswordResetToken> {
    const token: PasswordResetToken = {
      id: nextId('reset-token'),
      userId,
      tokenHash,
      expiredAt,
      usedAt: null,
      createdAt: new Date(),
    };
    this.tokens.set(token.id, token);
    return token;
  }

  async findValidByTokenHash(tokenHash: string): Promise<PasswordResetToken | null> {
    return (
      [...this.tokens.values()].find(
        (t) => t.tokenHash === tokenHash && !t.usedAt && t.expiredAt.getTime() > Date.now(),
      ) ?? null
    );
  }

  async markUsed(id: string): Promise<void> {
    const token = this.tokens.get(id);
    if (token) token.usedAt = new Date();
  }
}

export class FakeAuditService implements IAuditService {
  records: Array<{ entity: string; entityId: string; action: AuditAction; context: AuditContext }> = [];

  async record(
    entity: string,
    entityId: string,
    action: AuditAction,
    _oldValue: Record<string, unknown> | null,
    _newValue: Record<string, unknown> | null,
    context: AuditContext,
  ): Promise<void> {
    this.records.push({ entity, entityId, action, context });
  }
}
