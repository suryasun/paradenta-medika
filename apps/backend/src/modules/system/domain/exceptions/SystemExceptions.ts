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
// Multi Branch Platform (docs/03-sad/21-module-system.md UC-SYS-002,
// Phase 4 Epic BA task-210/211).
// ---------------------------------------------------------------------------

/** Literal per task-210's own Security Impact: "SYS_BRANCH_SCOPE_INVALID (422) returned for an invalid default/assigned branch." */
export class BranchScopeInvalidException extends BusinessException {
  constructor(reason: string) {
    super('SYS_BRANCH_SCOPE_INVALID', reason);
  }
}

/** UC-SYS-002's "no self-escalation policy" -- a user cannot grant themselves a new branch. */
export class SelfEscalationForbiddenException extends AuthorizationException {
  constructor() {
    super('You cannot change your own branch assignments', 'SYS_SELF_ESCALATION_FORBIDDEN');
  }
}

/**
 * task-216's BranchScopeGuard rejection. Distinct from BranchScopeInvalidException
 * (SYS_BRANCH_SCOPE_INVALID, 422, task-210): that one flags an invalid/inactive
 * branchId in an assignment payload; this one is an authorization-time
 * rejection (403) of a request targeting a branch the requester isn't
 * assigned to.
 */
export class BranchOutOfScopeException extends AuthorizationException {
  constructor() {
    super('The requested branch is outside your assigned branch scope', 'SYS_BRANCH_SCOPE_FORBIDDEN');
  }
}

/** Literal per task-217's own Backend Scope: "SYS_ROLE_SYSTEM_PROTECTED" for built-in roles. */
export class RoleSystemProtectedException extends AuthorizationException {
  constructor() {
    super('Built-in system roles cannot have their branch policy changed', 'SYS_ROLE_SYSTEM_PROTECTED');
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

// ---------------------------------------------------------------------------
// Approval Workflow (docs/03-sad/21-module-system.md UC-SYS-003/UC-SYS-004,
// Epic AK task-200-206). Codes marked "literal" appear in Section 6.4;
// others are extrapolated by the same convention already used above.
// ---------------------------------------------------------------------------

/** Literal Section 6.4: "SYS_SECRET_VALUE_FORBIDDEN | 422 | Raw secret value supplied instead of reference." */
export class SecretValueForbiddenException extends BusinessException {
  constructor() {
    super('SYS_SECRET_VALUE_FORBIDDEN', 'Raw secret values are not accepted; supply a secret reference for valueType SECRET_REF');
  }
}

/** Literal Section 6.4: "SYS_CONFIG_SCHEMA_INVALID | 422 | Value does not match typed schema." */
export class ConfigSchemaInvalidException extends BusinessException {
  constructor(reason: string) {
    super('SYS_CONFIG_SCHEMA_INVALID', `Value does not match the declared schema: ${reason}`);
  }
}

export class SystemParameterNotFoundException extends NotFoundException {
  constructor() {
    super('System parameter not found');
  }
}

/** Literal Section 6.4: "SYS_CONFIG_VERSION_CONFLICT | 409 | Effective version conflict." */
export class ConfigVersionConflictException extends ConflictException {
  constructor() {
    super('Another change was activated for this parameter/scope after this request was proposed', 'SYS_CONFIG_VERSION_CONFLICT');
  }
}

export class ConfigurationChangeRequestNotFoundException extends NotFoundException {
  constructor() {
    super('Configuration change request not found');
  }
}

export class ConfigurationChangeRequestNotPendingException extends BusinessException {
  constructor() {
    super('SYS_CONFIG_REQUEST_NOT_PENDING', 'This change request has already been approved or rejected');
  }
}

/** Literal Section 6.4: "SYS_CONFIG_APPROVAL_REQUIRED | 403 | High-risk config needs approval." Reused here for the specific self-approval case per task-203's own AC. */
export class ConfigApprovalRequiredException extends AuthorizationException {
  constructor() {
    super('The requester of this change cannot also approve it', 'SYS_CONFIG_APPROVAL_REQUIRED');
  }
}

export class RollbackReasonRequiredException extends BusinessException {
  constructor() {
    super('SYS_ROLLBACK_REASON_REQUIRED', 'A reason is required to roll back a parameter');
  }
}

/** Literal Section 6.4: "SYS_FLAG_AUTH_BYPASS_FORBIDDEN | 422 | Flag attempts to replace authorization." */
export class FlagAuthBypassForbiddenException extends BusinessException {
  constructor() {
    super('SYS_FLAG_AUTH_BYPASS_FORBIDDEN', 'A feature flag cannot grant a permission the requester does not already have');
  }
}

export class FlagReviewDateRequiredException extends BusinessException {
  constructor() {
    super('SYS_FLAG_REVIEW_DATE_REQUIRED', 'Critical-risk feature flags require an expiry/review date');
  }
}

export class FeatureFlagNotFoundException extends NotFoundException {
  constructor() {
    super('Feature flag not found');
  }
}

export class FeatureFlagKeyExistsException extends ConflictException {
  constructor() {
    super('Feature flag key already exists', 'SYS_FLAG_KEY_EXISTS');
  }
}

export class MenuNotFoundException extends NotFoundException {
  constructor() {
    super('Menu not found');
  }
}

export class MenuKeyExistsException extends ConflictException {
  constructor() {
    super('Menu key already exists', 'SYS_MENU_KEY_EXISTS');
  }
}

// ---------------------------------------------------------------------------
// Background Job Operations (docs/03-sad/21-module-system.md UC-SYS-007,
// Epic AL task-207-209).
// ---------------------------------------------------------------------------

export class BackgroundJobNotFoundException extends NotFoundException {
  constructor() {
    super('Background job not found');
  }
}

/** Literal Section 6.4: "SYS_JOB_NOT_RETRYABLE | 409 | Job type/status cannot be retried." */
export class JobNotRetryableException extends ConflictException {
  constructor() {
    super('This job type is not retryable, or is not currently in a retryable status', 'SYS_JOB_NOT_RETRYABLE');
  }
}

/** Extrapolated -- no literal Section 6.4 code for this specific case; docs/06-tasks/task-209.md AC: "does not silently lose the compensation requirement." */
export class JobAlreadySucceededException extends ConflictException {
  constructor() {
    super('This job already succeeded and committed its external side effect; cancel is not possible -- use a compensating transaction instead', 'SYS_JOB_ALREADY_SUCCEEDED');
  }
}
