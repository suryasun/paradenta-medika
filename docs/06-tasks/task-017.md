# task-017: Role List & Create (GET/POST /system/roles)

**Phase:** Phase 1 - Foundation (MVP)  
**Epic:** B. User & Access Administration  
**Feature:** B2. Role & Permission Management  
**Module:** System Administration  
**Priority:** P0 - Blocking

---

## Business Goal

Allow an Administrator to define the Roles referenced throughout RBAC (Owner, Clinic Manager, Registration Staff, Doctor, Nurse, Cashier, Warehouse Staff, Finance Staff, HR, Administrator per docs/03-sad/01-system-overview.md Section 5).

## Depends On

- task-013
- task-014

## Required Documents

- **AI Contract:** docs/04-ai-contract/07-module-contract.md
- **PRD:** docs/01-prd/features/system.md
- **SAD:** docs/03-sad/21-module-system.md Section 6.1 (GET/POST /system/roles, permission system.role.read/system.role.manage)
- **Design:** No page-level spec exists yet (documented gap).

## Required Existing Code

task-003 (roles table), task-013, task-014.

## Backend Scope

- GET /system/roles (list).
- POST /system/roles (create).
- CreateRoleUseCase, ListRolesUseCase.

## Frontend Scope

- Role List page and Create Role form.

## Database Impact

- Reads/writes roles table.

## API Impact

- Adds GET/POST /system/roles.

## Workflow Impact

Seeds the Role catalog that task-018 (permission assignment) and task-020 (assign role to user) depend on.

## Security Impact

- Gated by system.role.read / system.role.manage.

## Testing Required

- Unit + integration tests for both endpoints.

## Deliverables

- Controllers, routes, Use Cases, DTOs, tests.

## Acceptance Criteria

- Roles can be listed and created; role names correspond to the roles enumerated in docs/03-sad/01-system-overview.md Section 5.

## Definition of Done

- Implemented, tested, permission-gated.

---

## Dependency Detail

- **Blocked By:** task-013, task-014.
- **Required Before:** task-018, task-020.
- **Can Run In Parallel With:** task-015, task-016.
