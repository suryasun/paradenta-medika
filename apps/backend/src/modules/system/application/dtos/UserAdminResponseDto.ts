import { User } from '@prisma/client';

/**
 * docs/04-ai-contract/04-api-contract.md API-053 / docs/04-ai-contract/
 * 05-auth-contract.md AUTH-067: password hash MUST NOT be returned to the
 * client.
 *
 * `roleIds` is only populated by the detail endpoint (`GetUserUseCase` now
 * joins `IUserRoleRepository.listRolesForUser`, added post-launch per
 * docs/03-sad/21-module-system.md Section 6.1 addendum) -- list/create/
 * update/activate/deactivate never had role data to join and still omit
 * it (stays `undefined`), so this field is optional rather than forcing
 * a role lookup on every one of those call sites.
 */
export interface UserAdminResponseDto {
  id: string;
  username: string;
  email: string;
  status: string;
  lastLoginAt: Date | null;
  createdAt: Date;
  roleIds?: string[];
}

export function toUserAdminResponse(user: User, roleIds?: string[]): UserAdminResponseDto {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    status: user.status,
    lastLoginAt: user.lastLoginAt,
    createdAt: user.createdAt,
    roleIds,
  };
}
