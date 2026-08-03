import { AuthorizationException, ConflictException, BusinessException, NotFoundException } from '../../../../shared/http/exceptions';

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

// ---------------------------------------------------------------------------
// Notification Center (docs/03-sad/21-module-system.md UC-SYS-005,
// Epic AJ task-195-199). No literal Section 6.4 code exists for template
// content/variable validation -- extrapolated by the same
// `SYS_CONFIG_SCHEMA_INVALID`-style naming convention already used for
// System's own config validation.
// ---------------------------------------------------------------------------

export class NotificationTemplateNotFoundException extends NotFoundException {
  constructor() {
    super('Notification template not found');
  }
}

export class TemplateContentUnsafeException extends BusinessException {
  constructor(reason: string) {
    super('SYS_TEMPLATE_CONTENT_UNSAFE', `Template content rejected by channel policy: ${reason}`);
  }
}

export class TemplateVariableMissingException extends BusinessException {
  constructor(missing: string[]) {
    super('SYS_TEMPLATE_VARIABLE_MISSING', `Missing required template variable(s): ${missing.join(', ')}`);
  }
}

export class NotificationNotFoundException extends NotFoundException {
  constructor() {
    super('Notification not found');
  }
}

export class NotificationNotOwnedException extends AuthorizationException {
  constructor() {
    super('This notification does not belong to the requester', 'SYS_NOTIFICATION_NOT_OWNED');
  }
}
