# Epic BA: Multi Branch Configuration (Branch Assignment + Default Branch Policy) — Documentation (task-210–213)

> Documentation per the template in `phase-2-documentation/epic-k-appointment-analytics.md`'s header note.

---

## Documentation Reviewed

- `docs/06-tasks/task-210.md`, `task-211.md`, `task-212.md`, `task-213.md`
- `docs/03-sad/21-module-system.md` Section 6.1 (User and Access Administration endpoint table), Section 4.3 UC-SYS-002 Change Role or Branch Scope
- `docs/03-sad/11-module-master-data.md` Section 11.2 (Branch business rule: "Default Branch ditentukan melalui System Parameter")
- `docs/04-ai-contract/07-module-contract.md` MOD-003 (Repository Interface as a sanctioned cross-module channel)
- `docs/06-tasks/phase-4-plan.md` Ambiguity #1 (task-210 vs. task-019 overlap — resolved as no actual overlap; see `phase-4-implementation-report.md` Section 4)

## Task List

| Task | Name |
|---|---|
| task-210 | Assign Branch to User (`POST /system/users/{userId}/branches`) |
| task-211 | List User's Branch Memberships (`GET /system/users/{userId}/branches`) |
| task-212 | Default Branch Resolution Policy (internal domain service) |
| task-213 | Branch Configuration View (`GET /system/branches/{branchId}/configuration`) |

## Implementation Plan

A new `system_user_branches` table (Prisma model `UserBranch`) tracks each user's branch memberships with exactly one `isDefault: true` row per user, replaced wholesale on every `POST` (not additive). `ResolveDefaultBranchUseCase` is a pure domain service (no endpoint) consumed by future branch-scoped workflows: user-default → clinic-level `masterdata.branch.default` System Parameter (scoped `GLOBAL`, since this codebase's `SystemParameter` implementation has no `CLINIC` tier — see `phase-4-implementation-report.md` Section 5 #1) → explicit `NoDefaultBranchConfiguredException`. `GetBranchConfigurationUseCase` aggregates every `BRANCH`-scope parameter override for a branch plus every `GLOBAL`-scope parameter not overridden at branch level, tagging each entry's `source`.

## Files Created

- `apps/backend/src/modules/system/domain/repositories/IUserBranchRepository.ts`
- `apps/backend/src/modules/system/infrastructure/repositories/UserBranchRepository.ts`
- `apps/backend/src/modules/system/application/use-cases/AssignUserBranchUseCase.ts` + `.test.ts` (combined with task-211 in `BranchAssignment.test.ts`)
- `apps/backend/src/modules/system/application/use-cases/ListUserBranchesUseCase.ts`
- `apps/backend/src/modules/system/application/dtos/AssignUserBranchRequestDto.ts`, `UserBranchResponseDto.ts`
- `apps/backend/src/modules/system/presentation/controllers/UserBranchController.ts`
- `apps/backend/src/modules/master-data/domain/services/ResolveDefaultBranchUseCase.ts` + `.test.ts`
- `apps/backend/src/modules/system/application/use-cases/GetBranchConfigurationUseCase.ts` + `.test.ts`
- `apps/backend/prisma/migrations/20260804023731_phase4_branch_assignment_and_role_cross_branch/` (also carries task-217's `Role.isCrossBranch` column, added opportunistically in the same migration since both touch `schema.prisma` in the same session pass)

## Files Modified

- `apps/backend/prisma/schema.prisma` (new `UserBranch` model + `userBranches` relations on `User`/`Branch`)
- `apps/backend/src/modules/system/presentation/routes/system.routes.ts` (registered both routes, wired `UserBranchController`)
- `apps/backend/src/modules/system/presentation/controllers/ApprovalWorkflowController.ts` (added `getBranchConfiguration` handler — reuses the existing parameters controller rather than a new one, since the endpoint is parameter-aggregation)
- `apps/backend/src/modules/master-data/domain/exceptions/MasterDataExceptions.ts` (`NoDefaultBranchConfiguredException`)
- `apps/backend/src/modules/system/domain/exceptions/SystemExceptions.ts` (`BranchScopeInvalidException`, `SelfEscalationForbiddenException`)
- `apps/backend/prisma/seed.ts` (`system.user.branch.manage` permission)

## Database Changes

New `system_user_branches` table (`userId`, `branchId`, `isDefault`, `effectiveFrom`, `createdBy`, unique on `(userId, branchId)`, indexed on `branchId`).

## API Changes

| Endpoint | Permission |
|---|---|
| `POST /system/users/{userId}/branches` | `system.user.branch.manage` |
| `GET /system/users/{userId}/branches` | `system.user.read`, or self-read always allowed |
| `GET /system/branches/{branchId}/configuration` | `system.parameter.read` |

`SYS_BRANCH_SCOPE_INVALID` (422): non-existent/inactive branch, zero or more than one `isDefault`, or a duplicate `branchId`. `SYS_SELF_ESCALATION_FORBIDDEN` (403): a user cannot change their own assignments. task-212 has no endpoint (internal service).

## Frontend Changes

None — every task's own Frontend Scope confirms backend-only; no `docs/02-design` coverage exists yet for these screens.

## Security Validation

- Self-escalation check runs before the user-existence check (order doesn't affect the rejection, but keeps the highest-risk check first).
- On successful reassignment, `AssignUserBranchUseCase` calls `sessionRepository.revokeAllForUser` — the user's next login carries the refreshed branch scope, per UC-SYS-002 step 4.
- `ListUserBranchesUseCase`'s self-bypass is enforced in the use case, not route middleware, since `requirePermission` has no self-bypass shape.

## Architecture Validation

- `ResolveDefaultBranchUseCase` lives in `master-data/domain/services/` (per task-212's own "Module: Master Data" header) but consumes System's `IUserBranchRepository`/`ISystemParameterRepository` directly — a Repository Interface is an explicitly sanctioned cross-module channel per MOD-003, the same precedent used for task-225's cross-module open-transaction check.
- The GLOBAL-vs-CLINIC scope substitution is documented in the use case's own doc comment, not silently assumed.
