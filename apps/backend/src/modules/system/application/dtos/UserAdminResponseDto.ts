import { User } from '@prisma/client';

/**
 * docs/04-ai-contract/04-api-contract.md API-053 / docs/04-ai-contract/
 * 05-auth-contract.md AUTH-067: password hash MUST NOT be returned to the
 * client.
 */
export interface UserAdminResponseDto {
  id: string;
  username: string;
  email: string;
  status: string;
  lastLoginAt: Date | null;
  createdAt: Date;
}

export function toUserAdminResponse(user: User): UserAdminResponseDto {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    status: user.status,
    lastLoginAt: user.lastLoginAt,
    createdAt: user.createdAt,
  };
}
