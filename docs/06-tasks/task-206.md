# task-206: Menu (Entity, Migration & CRUD + Permission Mapping)

**Phase:** Phase 3 - Operational Excellence
**Epic:** AK. Approval Workflow
**Feature:** AK4. Menu Management
**Module:** System
**Priority:** P2 - Medium

---

## Business Goal

Create the `Menu` entity/migration and `GET/POST /system/menus`, `PATCH /system/menus/{menuId}/permissions` per docs/03-sad/21-module-system.md Section 6.2, so navigation visibility can be mapped to RBAC permissions.

## Depends On

- task-013 (Authentication Middleware)
- task-014 (Authorization Middleware)
- task-006 (Audit Trail Service)

## Required Documents

- **AI Contract:** docs/04-ai-contract/07-module-contract.md, docs/04-ai-contract/04-api-contract.md, docs/04-ai-contract/06-database-contract.md, docs/04-ai-contract/09-security-contract.md, docs/04-ai-contract/05-auth-contract.md
- **PRD:** docs/01-prd/features/system.md, docs/01-prd/business-rules.md § 10
- **SAD:** docs/03-sad/21-module-system.md (Section 3.2 Core Entities (Feature Flag and Menu), Section 6.2 API)
- **Design:** No page-level spec exists yet (documented gap in docs/02-design/pages/overview.md) — follow CLAUDE.md frontend rules until a design spec exists.

## Required Existing Code

task-013, task-014, task-006.

## Backend Scope

- Domain layer: `Menu` entity (key, label, route, parentId, requiredPermissions).
- Infrastructure layer: Prisma migration for `system_menus`.
- Application layer: `CreateMenuUseCase`, `ListMenusUseCase`, `UpdateMenuPermissionsUseCase`.

## Frontend Scope

No dedicated page in this task; backend-only per Backend Scope. Any UI consuming this endpoint is scoped to a later frontend task once docs/02-design coverage exists.

## Database Impact

Creates system_menus table.

## API Impact

Adds GET/POST /system/menus, PATCH /system/menus/{menuId}/permissions.

## Workflow Impact

Supports role-driven navigation visibility across the whole application.

## Security Impact

`SYS_PERMISSION_ASSIGNMENT_INVALID` (422) rejects an unknown/invalid permission mapping on a menu item.

## Testing Required

- Unit tests for the Use Case/Entity (per docs/05-testing/unit-tests.md).
- Integration test for Controller/Repository (per docs/05-testing/api-tests.md).

## Deliverables

- `Menu` entity, migration, repository
- Create/List/UpdatePermissions use cases, routes, controllers, tests

## Acceptance Criteria

Per docs/01-prd/acceptance-criteria/system.md (sourced from docs/03-sad/21-module-system.md):

- Menu permission mapping validated against the live permission catalog.

## Definition of Done

Entity, migration, and CRUD endpoints implemented and tested.

---

## Dependency Detail

- **Blocked By:** task-013, task-014, task-006
- **Required Before:** See phase-3-plan.md Implementation Order.
- **Can Run In Parallel With:** Tasks in other Epics once own dependencies are satisfied.
