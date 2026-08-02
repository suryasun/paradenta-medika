import { UserSession } from '@prisma/client';

export interface CreateSessionInput {
  userId: string;
  deviceId?: string;
  deviceName?: string;
  deviceType?: string;
  browser?: string;
  ipAddress?: string;
  refreshTokenHash: string;
  expiredAt: Date;
}

export interface ISessionRepository {
  create(input: CreateSessionInput): Promise<UserSession>;
  findById(id: string): Promise<UserSession | null>;
  findActiveByRefreshTokenHash(refreshTokenHash: string): Promise<UserSession | null>;
  findByPreviousRefreshTokenHash(refreshTokenHash: string): Promise<UserSession | null>;
  rotateRefreshToken(sessionId: string, currentHash: string, newRefreshTokenHash: string, newExpiredAt: Date): Promise<void>;
  revoke(sessionId: string): Promise<void>;
  revokeAllForUser(userId: string): Promise<void>;
  touchLastUsed(sessionId: string): Promise<void>;
}
