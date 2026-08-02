# task-014: Authorization Middleware (RBAC Permission Check)

**Phase:** Phase 1 - Foundation (MVP)  
**Epic:** A. Authentication & Authorization  
**Feature:** A3. RBAC Enforcement Middleware  
**Module:** Authentication  
**Priority:** P0 - Blocking

---

## Business Goal

Provide the shared middleware that enforces Role-Based Access Control, ensuring an authenticated user can only invoke endpoints their role/permission set allows.

## Depends On

- task-013

## Required Documents

- **AI Contract:** docs/04-ai-contract/05-auth-contract.md (RBAC and Role Hierarchy, Permission Naming and Evaluation sections)
- **PRD:** docs/01-prd/business-rules.md
- **SAD:** docs/03-sad/02-system-architecture.md Section 17 (Authorization & RBAC), Section 17.2 (Permission Type)
- **Design:** N/A

## Required Existing Code

task-013 (must run first to attach user/role context to the request).

## Backend Scope

- Middleware factory: requirePermission(permissionCode) returning Express middleware that checks the authenticated user's resolved permissions include the required code.
- On failure, respond 403 with the standard error envelope.
- Permission codes follow the dot-notation convention shown in docs/03-sad/09-api-standard.md (e.g. patient.create) and the module-specific permission codes documented per module (e.g. system.user.manage in docs/03-sad/21-module-system.md).

## Frontend Scope

- Permission Guard component/hook that hides or disables UI actions the current user's permission set does not allow, per docs/02-design/ui-guidelines.md Section on Permission Guards -- while never treating this as the actual security boundary.

## Database Impact

- Read-only -- resolves role_permissions for the current user.

## API Impact

- Applied per-route across all modules; every protected endpoint's task must specify which permission code(s) it requires.

## Workflow Impact

Enforces the RBAC rules documented per module (e.g. Cashier can Payment/Refund/Closing but not Edit EMR; Doctor can EMR/SOAP/Treatment but not Payroll, per docs/03-sad/01-system-overview.md Section 5).

## Security Impact

- This is the authorization boundary -- menu/UI visibility (task in Epic I / navigation) is a convenience only; this middleware is the actual enforcement point (docs/03-sad/21-module-system.md line 59).

## Testing Required

- Unit test: user with required permission passes.
- Unit test: user without required permission is rejected with 403.
- Integration test against a sample protected route per role.

## Deliverables

- Authorization middleware factory, unit + integration tests.

## Acceptance Criteria

- A user lacking the required permission is rejected with 403 regardless of authentication validity.
- A user with the required permission proceeds to the controller.

## Definition of Done

- Implemented, tested, and available for every module task to apply per-route.

---

## Dependency Detail

- **Blocked By:** task-013.
- **Required Before:** Every protected endpoint task in Epics B-I (each must declare its required permission code).
- **Can Run In Parallel With:** None -- foundational to all subsequent endpoint tasks.
