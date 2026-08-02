// Mirrors apps/backend/src/modules/system/application/dtos/UserAdminResponseDto.ts
export interface SystemUser {
  id: string;
  username: string;
  email: string;
  status: "ACTIVE" | "INACTIVE";
  lastLoginAt: string | null;
  createdAt: string;
}

// Roles/Permissions have no dedicated response DTO -- apps/backend's
// ListRolesUseCase/ListPermissionsUseCase return the raw Prisma row.
export interface Role {
  id: string;
  roleCode: string;
  roleName: string;
  description: string | null;
  isSystem: boolean;
}

export interface Permission {
  id: string;
  module: string;
  permissionKey: string;
  permissionName: string;
  description: string | null;
}

export interface CreateUserInput {
  username: string;
  email: string;
  password: string;
  roleIds?: string[];
}

export interface CreateRoleInput {
  roleCode: string;
  roleName: string;
  description?: string;
}

export interface ListUsersParams {
  page?: number;
  limit?: number;
  search?: string;
}
