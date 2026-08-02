# task-019: Assign Role to User (POST /system/users/{userId}/roles)

**Phase:** Phase 1 - Foundation (MVP)  
**Epic:** B. User & Access Administration  
**Feature:** B2. Role & Permission Management  
**Module:** System Administration  
**Priority:** P0 - Blocking

---

## Business Goal

Allow an Administrator to grant a user one or more roles, connecting the User Management (task-015/016) and Role Management (task-017/018) features into a working RBAC system.

## Depends On

- task-015
- task-017

## Required Documents

- **AI Contract:** docs/04-ai-contract/07-module-contract.md
- **PRD:** docs/01-prd/features/system.md
- **SAD:** docs/03-sad/21-module-system.md Section 6.1 (POST /system/users/{userId}/roles, permission system.user.role.manage)
- **Design:** No page-level spec exists yet (documented gap).

## Required Existing Code

task-015, task-017.

## Backend Scope

- AssignRoleUseCase: attach one or more role IDs to a user (per the example payload in docs/03-sad/21-module-system.md Section 6.1: roleIds, branchAssignments, reason).
- POST /system/users/{userId}/roles controller + DTOs.

## Frontend Scope

- Role assignment control on the User Detail page (task-016).

## Database Impact

- Writes to user_roles table.

## API Impact

- Adds POST /system/users/{userId}/roles.

## Workflow Impact

Without this, a created user (task-015) has no permissions at all and cannot use any protected endpoint.

## Security Impact

- Gated by system.user.role.manage.
- Assignment reason should be recorded to the Audit Trail per the 'reason' field in the documented payload.

## Testing Required

- Unit test: assigning a role to a user changes their resolved permission set.
- Integration test: a newly role-assigned user can call an endpoint gated by that role's permission.

## Deliverables

- Controller, route, Use Case, DTOs, tests.

## Acceptance Criteria

- A user with an assigned role inherits that role's permissions on their next authenticated request.
- Audit Trail records the assignment with its reason.

## Definition of Done

- Implemented, tested, audit-logged.

---

## Dependency Detail

- **Blocked By:** task-015, task-017.
- **Required Before:** Any manual/QA verification that a non-Administrator role (Doctor, Cashier, etc.) can use its module's endpoints.
- **Can Run In Parallel With:** task-018, task-020.
