# Epic BC: Branch-Level Access Control — Documentation (task-216–217)

---

## Documentation Reviewed

- `docs/06-tasks/task-216.md`, `task-217.md`
- `docs/03-sad/21-module-system.md` Section 8.1 Authorization Model, Section 2.1 Responsibility Matrix ("server-derived branch scope" pattern)
- `phase-4-plan.md` Ambiguity #7 (retrofit is explicitly partial — not a full retrofit of ~200 endpoints)

## Task List

| Task | Name |
|---|---|
| task-216 | Branch Scope Authorization Guard (cross-cutting middleware extension) |
| task-217 | Branch Access Policy per Role (`PATCH /system/roles/{roleId}/branch-policy`) |

## Implementation Plan

`createBranchScopeGuard(userRoleRepository, userBranchRepository, getTargetBranchId)` is a middleware **factory**, not a fixed middleware — each call site supplies its own `getTargetBranchId(req)` extractor (path param, body field, or query filter), so the guard has zero knowledge of any module's route shape. Cross-branch roles (`Role.isCrossBranch`) bypass the intersection entirely; a request whose extractor returns `undefined` (no explicit branch target) passes through unguarded. Retrofitted onto exactly one representative endpoint each in Reservation, Billing, and Warehouse, per the task's own Definition of Done — not a full retrofit. `Role.isCrossBranch` (added to the `Role` model) is flipped via a dedicated endpoint, rejecting built-in (`isSystem: true`) roles.

## Files Created

- `apps/backend/src/modules/system/infrastructure/middlewares/branchScopeGuard.ts` + `.test.ts`
- `apps/backend/src/modules/system/application/use-cases/UpdateRoleBranchPolicyUseCase.ts` + `.test.ts`
- `apps/backend/src/modules/system/application/dtos/UpdateRoleBranchPolicyRequestDto.ts`

## Files Modified

- `apps/backend/prisma/schema.prisma` (`Role.isCrossBranch: Boolean @default(false)`)
- `apps/backend/src/modules/system/domain/exceptions/SystemExceptions.ts` (`BranchOutOfScopeException` — `SYS_BRANCH_SCOPE_FORBIDDEN`, 403; `RoleSystemProtectedException` — `SYS_ROLE_SYSTEM_PROTECTED`, 403; deliberately distinct from `BranchScopeInvalidException`'s `SYS_BRANCH_SCOPE_INVALID`, 422, since one is an authz-time rejection and the other a payload-validation error)
- `apps/backend/src/modules/system/domain/repositories/IRoleRepository.ts` (`updateBranchPolicy(id, isCrossBranch)`)
- `apps/backend/src/modules/system/infrastructure/repositories/RoleRepository.ts`, `apps/backend/tests/fakes/systemFakes.ts` (`updateBranchPolicy` implementation; `buildRole`/`FakeRoleRepository.create` gained `isCrossBranch` default)
- `apps/backend/src/modules/system/presentation/controllers/RoleAdminController.ts` (`updateBranchPolicy` handler)
- `apps/backend/src/modules/system/presentation/routes/system.routes.ts` (route registration)
- `apps/backend/src/app.ts` (builds one shared `branchScopeGuard` factory instance, threaded into `buildReservationModule`/`buildBillingModule`/`buildWarehouseModule`)
- `apps/backend/src/modules/reservation/presentation/routes/reservation.routes.ts` (retrofit: `GET /reservations/analytics`, extractor reads `query.branchId`)
- `apps/backend/src/modules/billing/presentation/routes/billing.routes.ts` (retrofit: `GET /billing/invoices`, extractor reads `query.branchId`)
- `apps/backend/src/modules/warehouse/presentation/routes/warehouse.routes.ts` (retrofit: `POST /warehouse/warehouses`, extractor reads `body.branchId`)
- `apps/backend/prisma/seed.ts` (`system.role.branch-policy.manage` permission; ADMINISTRATOR `isCrossBranch: true` — see Epic BB's doc for why this fix landed here)

## Database Changes

`roles.is_cross_branch` column added (part of the same migration as Epic BA's `system_user_branches` table).

## API Changes

| Endpoint | Permission |
|---|---|
| `PATCH /system/roles/{roleId}/branch-policy` | `system.role.branch-policy.manage` |

No new endpoint for the guard itself — it is middleware applied to existing routes. Three retrofitted endpoints (`GET /reservations/analytics`, `GET /billing/invoices`, `POST /warehouse/warehouses`) each gained a `403 SYS_BRANCH_SCOPE_FORBIDDEN` response.

## Frontend Changes

None — backend-only.

## Security Validation

- `SYS_ROLE_SYSTEM_PROTECTED` (403) is a hard reject on `role.isSystem`, checked before the repository write.
- Guard reads `Role.isCrossBranch` fresh on every request (no cache) — task-217's own AC ("Flipping the flag is immediately reflected... no stale cache") is satisfied structurally, not by an invalidation mechanism that could itself go stale.
- `BranchOutOfScopeException`'s `SYS_BRANCH_SCOPE_FORBIDDEN` is intentionally a distinct code from task-210's `SYS_BRANCH_SCOPE_INVALID` — conflating a payload-validation error with an authorization-time rejection would blur two different failure classes in client error handling.

## Architecture Validation

- The guard is deliberately not a fixed-shape middleware — a factory taking an extractor — so it composes with any route's request shape without the guard needing per-module knowledge, satisfying the task's "reusable... every module can apply" requirement literally.
- Retrofit scope (3 of ~200 endpoints) is a documented, task-approved boundary (Ambiguity #7), not an oversight — extending it further is explicitly future follow-up work per `phase-4-implementation-report.md` Section 8.
