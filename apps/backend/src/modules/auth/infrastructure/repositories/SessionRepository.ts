import { UserSession } from '@prisma/client';
import { prisma } from '../../../../shared/infrastructure/prisma';
import { CreateSessionInput, ISessionRepository } from '../../domain/repositories/ISessionRepository';

export class SessionRepository implements ISessionRepository {
  async create(input: CreateSessionInput): Promise<UserSession> {
    return prisma.userSession.create({
      data: {
        userId: input.userId,
        deviceId: input.deviceId,
        deviceName: input.deviceName,
        deviceType: input.deviceType,
        browser: input.browser,
        ipAddress: input.ipAddress,
        refreshTokenHash: input.refreshTokenHash,
        expiredAt: input.expiredAt,
      },
    });
  }

  async findById(id: string): Promise<UserSession | null> {
    return prisma.userSession.findUnique({ where: { id } });
  }

  async findActiveByRefreshTokenHash(refreshTokenHash: string): Promise<UserSession | null> {
    return prisma.userSession.findFirst({
      where: { refreshTokenHash, revokedAt: null },
    });
  }

  async findByPreviousRefreshTokenHash(refreshTokenHash: string): Promise<UserSession | null> {
    return prisma.userSession.findFirst({
      where: { previousRefreshTokenHash: refreshTokenHash },
    });
  }

  async rotateRefreshToken(
    sessionId: string,
    currentHash: string,
    newRefreshTokenHash: string,
    newExpiredAt: Date,
  ): Promise<void> {
    await prisma.userSession.update({
      where: { id: sessionId },
      data: {
        previousRefreshTokenHash: currentHash,
        refreshTokenHash: newRefreshTokenHash,
        expiredAt: newExpiredAt,
        lastUsedAt: new Date(),
      },
    });
  }

  async revoke(sessionId: string): Promise<void> {
    await prisma.userSession.update({
      where: { id: sessionId },
      data: { revokedAt: new Date() },
    });
  }

  async revokeAllForUser(userId: string): Promise<void> {
    await prisma.userSession.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async touchLastUsed(sessionId: string): Promise<void> {
    await prisma.userSession.update({ where: { id: sessionId }, data: { lastUsedAt: new Date() } });
  }
}
