# Epic BB: Centralized User Management — Documentation (task-214–215)

---

## Documentation Reviewed

- `docs/06-tasks/task-214.md`, `task-215.md`
- `docs/03-sad/21-module-system.md` Section 4.1 Actor Matrix (Administrator: full scope; Clinic Manager: scoped)
- `phase-4-implementation-report.md` Section 4 (Ambiguity resolutions) and Section 5 #4 (ADMINISTRATOR seed `isCrossBranch` fix, discovered while manually verifying this epic's own endpoint)

## Task List

| Task | Name |
|---|---|
| task-214 | Cross-Branch User Directory (`GET /system/users` extended with `branchId` filter) |
| task-215 | Branch-Scoped Role Assignment Matrix (`GET /system/roles/branch-matrix`) |

## Implementation Plan

`ListUsersUseCase` was extended to resolve the requester's own roles and check `Role.isCrossBranch`: a cross-branch requester's unfiltered request sees every user across every branch (branch filter applied only if an explicit `branchId` is given); a non-cross-branch requester's unfiltered request is automatically intersected with their own assigned branch(es) — never silently widened, even when zero branches are assigned (returns zero users, not everyone). `GetRoleBranchMatrixUseCase` builds an in-memory role×branch×user-count aggregation from every `UserRole` and `UserBranch` row, correctly reflecting a single user holding multiple roles across multiple branches concurrently.

## Files Created

- `apps/backend/src/modules/system/application/use-cases/GetRoleBranchMatrixUseCase.ts` + `.test.ts`
- `apps/backend/src/modules/system/application/dtos/ListUsersQueryDto.ts`
- `apps/backend/src/modules/system/application/use-cases/ListUsersUseCase.test.ts`

## Files Modified

- `apps/backend/src/modules/system/application/use-cases/ListUsersUseCase.ts` (rewritten: now takes `{ query, branchId, requesterUserId }` instead of a bare `ListQueryDto`)
- `apps/backend/src/modules/system/domain/repositories/IUserAdminRepository.ts` (`list()` gained an optional `UserAdminListFilter { branchIds }`)
- `apps/backend/src/modules/system/infrastructure/repositories/UserAdminRepository.ts` (Prisma `userBranches: { some: { branchId: { in } } }` join filter)
- `apps/backend/src/modules/system/domain/repositories/IUserRoleRepository.ts` (`listAllAssignments()` added, for the matrix aggregation)
- `apps/backend/src/modules/system/infrastructure/repositories/UserRoleRepository.ts`, `apps/backend/src/modules/system/domain/repositories/IUserBranchRepository.ts`, `UserBranchRepository.ts` (`listAllAssignments()` added to both)
- `apps/backend/src/modules/system/presentation/controllers/UserAdminController.ts` (`list` now reads `req.auth.userId` and passes `branchId`)
- `apps/backend/src/modules/system/presentation/controllers/RoleAdminController.ts` (`getRoleBranchMatrix` handler)
- `apps/backend/src/modules/system/presentation/routes/system.routes.ts` (route registration order moved so `userBranchRepository` is constructed before `userController`, since `ListUsersUseCase` now depends on it)
- `apps/backend/tests/fakes/systemFakes.ts` (`FakeUserAdminRepository` gained `branchAssignments`/`seedBranchAssignments`; `FakeUserRoleRepository`/`FakeUserBranchRepository` gained `listAllAssignments()`)
- `apps/backend/tests/integration/systemUserRoutes.test.ts` (seeds a cross-branch ADMINISTRATOR role for the test's `admin-1` actor, since the previous test predated per-user branch scoping entirely)

## Database Changes

None — reads the `system_user_branches`/`user_roles` tables added by Epic BA/Phase 1.

## API Changes

| Endpoint | Permission |
|---|---|
| `GET /system/users` (extended, no new route) | `system.user.read`, result scope intersected per Actor Matrix |
| `GET /system/roles/branch-matrix` | `system.role.read` |

## Frontend Changes

None — backend-only per both tasks' Frontend Scope.

## Security Validation

- Scope intersection happens inside `ListUsersUseCase`, not `requirePermission` middleware — the permission check only gates *whether* the endpoint is reachable at all; *which* users are visible is a business rule the use case owns.
- A non-cross-branch requester with **zero** branch assignments correctly sees **zero** users (empty `branchIds` array still applies as an `IN ()` filter, not "no filter") — verified by unit test, not just assumed.

## Architecture Validation

- No new tables. `listAllAssignments()` is the narrow, additive repository method precedent (Section 3 of `phase-4-implementation-report.md`) applied to two more interfaces.
- Caught during this epic's own manual verification pass: `admin`'s seeded `ADMINISTRATOR` role had never had `isCrossBranch` set to `true` (defaults to `false`), so the new scoping logic silently returned zero users for the admin account itself. Fixed in `prisma/seed.ts` (`update: { isCrossBranch: true }` on the upsert) and re-verified live — see `phase-4-implementation-report.md` Section 5 #4.
