# task-018: Assign Permissions to Role (PATCH /system/roles/{roleId}/permissions)

**Phase:** Phase 1 - Foundation (MVP)  
**Epic:** B. User & Access Administration  
**Feature:** B2. Role & Permission Management  
**Module:** System Administration  
**Priority:** P0 - Blocking

---

## Business Goal

Allow an Administrator to define which permissions each Role grants, which is what task-014's Authorization middleware ultimately checks against.

## Depends On

- task-017

## Required Documents

- **AI Contract:** docs/04-ai-contract/07-module-contract.md
- **PRD:** docs/01-prd/features/system.md
- **SAD:** docs/03-sad/21-module-system.md Section 6.1 (PATCH /system/roles/{roleId}/permissions, GET /system/permissions, permission system.permission.read / system.role.permission.manage)
- **Design:** No page-level spec exists yet (documented gap).

## Required Existing Code

task-003 (permissions, role_permissions tables), task-017.

## Backend Scope

- GET /system/permissions (list all defined permission codes).
- PATCH /system/roles/{roleId}/permissions (replace/update the permission set for a role).
- The permission catalog itself (which permission codes exist, e.g. patient.create, system.user.manage) must be seeded from the codes referenced across all module API specs in docs/03-sad/ -- this task should NOT invent new permission codes beyond what other module tasks declare needing.

## Frontend Scope

- Role Permission editor (checklist of permissions grouped by module).

## Database Impact

- Writes to role_permissions; reads permissions.

## API Impact

- Adds GET /system/permissions, PATCH /system/roles/{roleId}/permissions.

## Workflow Impact

This is what makes task-014's Authorization middleware meaningful in practice -- without assigned permissions, no role can do anything.

## Security Impact

- Gated by system.permission.read / system.role.permission.manage.
- Changing a role's permissions should take effect on the next request (or next token refresh) -- not require a full re-login, consistent with per-request permission resolution in task-014.

## Testing Required

- Unit test: assigning a permission to a role makes it appear in that role's resolved permission set.
- Integration test: a user whose role gains a permission can subsequently call the newly-permitted endpoint.

## Deliverables

- Controllers, routes, Use Cases, DTOs, tests, permission seed list.

## Acceptance Criteria

- Permissions can be listed and assigned per role.
- A role's permission changes are reflected in Authorization middleware checks.

## Definition of Done

- Implemented, tested; permission catalog documented alongside the module tasks that require each code.

---

## Dependency Detail

- **Blocked By:** task-017.
- **Required Before:** Full RBAC enforcement across all modules is only meaningfully testable once this exists.
- **Can Run In Parallel With:** task-019, task-020.
