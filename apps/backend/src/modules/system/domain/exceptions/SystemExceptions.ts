import { ConflictException, BusinessException, NotFoundException } from '../../../../shared/http/exceptions';

/**
 * Error codes per docs/03-sad/21-module-system.md Section 6.4.
 * SYS_ROLE_SYSTEM_PROTECTED is not implemented here: no Phase 1 task
 * (task-017/018) exposes a role rename/delete endpoint for it to guard --
 * only role create/list and permission assignment exist in this phase.
 */
export class UserIdentifierExistsException extends ConflictException {
  constructor() {
    super('Username or email already exists', 'SYS_USER_IDENTIFIER_EXISTS');
  }
}

export class PermissionAssignmentInvalidException extends BusinessException {
  constructor(invalidPermissionIds: string[]) {
    super('SYS_PERMISSION_ASSIGNMENT_INVALID', `Unknown permission id(s): ${invalidPermissionIds.join(', ')}`);
  }
}

export class UserNotFoundException extends NotFoundException {
  constructor() {
    super('User not found');
  }
}

export class RoleNotFoundException extends NotFoundException {
  constructor() {
    super('Role not found');
  }
}
