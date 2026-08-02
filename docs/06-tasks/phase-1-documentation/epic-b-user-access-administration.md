# Epic B: User & Access Administration — Documentation (task-015–020)

> Retroactive documentation, per the template in `epic-j-foundational-infrastructure.md`'s header note.

---

## Documentation Reviewed

- `docs/04-ai-contract/05-auth-contract.md` RBAC-001–016
- `docs/06-tasks/task-015.md`–`task-020.md`
- `docs/03-sad/21-module-system.md` (User/Role/Permission aggregate design)

## Task List

| Task | Name |
|---|---|
| task-015 | User List & Create (GET/POST /system/users) |
| task-016 | User Detail, Update, Activate/Deactivate |
| task-017 | Role List & Create (GET/POST /system/roles) |
| task-018 | Assign Permissions to Role (PATCH /system/roles/{roleId}/permissions) |
| task-019 | Assign Role to User (POST /system/users/{userId}/roles) |
| task-020 | Revoke User Sessions (POST /system/users/{userId}/revoke-sessions) |

## Implementation Plan

Built System Administration on top of Epic A's `User`/`Role`/`Permission`/`RolePermission`/`UserRole` tables: user CRUD + activate/deactivate, role CRUD, permission-to-role assignment, role-to-user assignment, and forced session revocation (administrator force-logout per AUTH-049). Every mutating use case audits before/after state via `AuditService` (Epic J).

## Files Created

`apps/backend/src/modules/system/` (excluding `domain/services/IAuditService.ts` and `infrastructure/services/AuditService*.ts`, which belong to Epic J): `application/dtos/*`, `application/use-cases/{ActivateUserUseCase,AssignPermissionsToRoleUseCase,AssignRoleToUserUseCase,CreateRoleUseCase,CreateUserUseCase,DeactivateUserUseCase,GetUserUseCase,ListPermissionsUseCase,ListRolesUseCase,ListUsersUseCase,RevokeUserSessionsUseCase,UpdateUserUseCase}.ts` (+ `.test.ts` siblings where present), `domain/{exceptions,repositories}/*`, `infrastructure/repositories/*`, `presentation/{controllers,routes}/*`.

## Files Modified

`apps/backend/src/app.ts` (mounted `buildSystemModule`, wired to `authModule.sessionRepository` for the revoke-sessions use case).

## Database Changes

None beyond Epic J's initial migration.

## API Changes

| Endpoint | Permission |
|---|---|
| `GET /system/users` | `system.user.read` |
| `POST /system/users` | `system.user.manage` |
| `GET /system/users/:userId` | `system.user.read` |
| `PATCH /system/users/:userId` | `system.user.manage` |
| `POST /system/users/:userId/activate` | `system.user.activate` |
| `POST /system/users/:userId/deactivate` | `system.user.deactivate` |
| `POST /system/users/:userId/roles` | (AssignRoleToUserUseCase) |
| `POST /system/users/:userId/revoke-sessions` | (RevokeUserSessionsUseCase) |
| `GET /system/roles` | `system.role.read` |
| `POST /system/roles` | `system.role.manage` |
| `GET /system/permissions` | `system.permission.read` |
| `PATCH /system/roles/:roleId/permissions` | (AssignPermissionsToRoleUseCase) |

## Frontend Changes

None. User/Role administration screens are not built — Phase 1 frontend work so far covers only Login and the Operations Dashboard (see `phase-1-implementation-report.md` Section 7 gap list).

## Security Validation

- RBAC-004/RBAC-006: standard role set (Owner, Clinic Manager, Administrator, Doctor, Nurse, Registration, Cashier, Warehouse, Finance, HR) supported without automatic hierarchy inheritance — roles are independent per RBAC-006, matching the SAD's explicit statement.
- Deactivating a user or revoking sessions immediately invalidates their active sessions — verified in `DeactivateUserUseCase.test.ts` / `RevokeUserSessionsUseCase.test.ts`.
- Every create/update/activate/deactivate/role-assignment call is behind `requirePermission`, never left open.

## Architecture Validation

- Reused Epic A's `ISessionRepository` for session revocation rather than duplicating session logic inside `system` — cross-module reuse of a read/write repository interface, consistent with the established pattern (not a database bypass, since it still goes through the owning module's Prisma-backed implementation).
- No direct SQL or Prisma call outside `infrastructure/repositories/`.
