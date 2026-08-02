import { PasswordResetToken } from '@prisma/client';
import { prisma } from '../../../../shared/infrastructure/prisma';
import { IPasswordResetTokenRepository } from '../../domain/repositories/IPasswordResetTokenRepository';

export class PasswordResetTokenRepository implements IPasswordResetTokenRepository {
  async create(userId: string, tokenHash: string, expiredAt: Date): Promise<PasswordResetToken> {
    return prisma.passwordResetToken.create({
      data: { userId, tokenHash, expiredAt },
    });
  }

  async findValidByTokenHash(tokenHash: string): Promise<PasswordResetToken | null> {
    return prisma.passwordResetToken.findFirst({
      where: { tokenHash, usedAt: null, expiredAt: { gt: new Date() } },
    });
  }

  async markUsed(id: string): Promise<void> {
    await prisma.passwordResetToken.update({ where: { id }, data: { usedAt: new Date() } });
  }
}
