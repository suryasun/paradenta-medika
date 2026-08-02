import { PasswordResetToken } from '@prisma/client';

export interface IPasswordResetTokenRepository {
  create(userId: string, tokenHash: string, expiredAt: Date): Promise<PasswordResetToken>;
  findValidByTokenHash(tokenHash: string): Promise<PasswordResetToken | null>;
  markUsed(id: string): Promise<void>;
}
