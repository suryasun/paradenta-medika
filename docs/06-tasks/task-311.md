# task-311: Server-Side Branch Scoping for Queue

**Phase:** Queue Module Addendum #1 (post-roadmap)
**Epic:** QA. Queue Module Enhancement
**Feature:** QA1. Branch-Scoped Queue Visibility
**Module:** Queue
**Priority:** P1 - High

---

## Business Goal

Prevent a multi-branch-scoped user from seeing Queue entries belonging to a branch they have no access to. `GET /queues`, `GET /queues/:id`, and `GET /queues/dashboard` currently accept an optional `branchId` filter but enforce nothing server-side — any authenticated user with `queue.read` can view any branch's board today. This closes that gap using the same `UserBranch`/`Role.isCrossBranch` data already relied on by `branchScopeGuard.ts` for Reservation's analytics route, but as real query-level narrowing rather than an explicit-target rejection.

## Depends On

- task-037 (Create Queue), task-038 (Queue List), task-039 (Queue Detail), task-047 (Queue Dashboard)
- task-215/216 (Branch Scope Guard infrastructure — reused for its `UserBranch`/`isCrossBranch` lookups, not its middleware shape)

## Required Documents

- **AI Contract:** `docs/04-ai-contract/05-auth-contract.md` RBAC-011/012 (dynamic/resource ownership validation)
- **SAD:** `docs/03-sad/14-module-queue.md` §29.1.1 (this addendum), §6.4; `docs/03-sad/10-authentication.md` §27.4 (ownership table)
- **Business Rules:** `docs/01-prd/business-rules.md` "Queue Module Addendum #1"

## Required Existing Code

`apps/backend/src/modules/system/infrastructure/middlewares/branchScopeGuard.ts` (pattern reference only — resolves `UserBranch`/`isCrossBranch` per request, but only rejects an explicit out-of-scope target; does not narrow unfiltered queries), `IUserRoleRepository`, `IUserBranchRepository` (existing interfaces/implementations in `system`/`auth` modules), `QueueRepository.ts`, `ListQueueUseCase.ts`, `GetQueueDetailUseCase.ts`, `QueueDashboardUseCase.ts`.

## Backend Scope

- New `apps/backend/src/modules/queue/application/services/resolveQueueScope.ts`: `resolveQueueScope(userId, roleCodes, { userRoleRepository, userBranchRepository, doctorRepository }) → Promise<{ allowedBranchIds?: string[]; restrictToDoctorId?: string }>`. Returns `allowedBranchIds: undefined` for cross-branch roles (no restriction); otherwise the list of the user's assigned `UserBranch.branchId` values. Doctor-restriction half of the return value is task-312's concern but the shared shape is defined here.
- `IQueueRepository.ts`: `QueueListFilters` gains `allowedBranchIds?: string[]`.
- `QueueRepository.ts`: `search()`'s `where` adds `branchId: { in: allowedBranchIds }` when `allowedBranchIds` is set.
- `ListQueueUseCase.ts`, `GetQueueDetailUseCase.ts`, `QueueDashboardUseCase.ts`: accept the resolved scope and apply it; `GetQueueDetailUseCase` throws the existing `QueueNotFoundException` when the fetched record's `branchId` is outside `allowedBranchIds` (404, not 403 — avoids confirming cross-branch record existence).
- `QueueController.ts` / `QueueDashboardController.ts` / `queue.routes.ts`: composition root wires `resolveQueueScope` (with `UserRoleRepository`, `UserBranchRepository` instances) and calls it before each use-case invocation.

## Frontend Scope

None — the frontend does not send an explicit `branchId` today for the default board view, so no client change is required; the API now defaults to "my scope" automatically.

## Database Impact

None — reuses existing `UserBranch`/`Role.isCrossBranch` tables.

## API Impact

`GET /queues`, `GET /queues/:id`, `GET /queues/dashboard` responses are now implicitly scoped to the caller's branches. No new query params, no breaking response-shape change.

## Workflow Impact

None — visibility restriction only, no change to Queue state transitions.

## Security Impact

Closes a genuine access-control gap (unrestricted cross-branch Queue visibility). Follows RBAC-011/012.

## Testing Required

- Unit: `resolveQueueScope` — cross-branch role bypasses restriction; non-cross-branch role narrows to assigned branches.
- Unit: `ListQueueUseCase`/`QueueRepository.search` with `allowedBranchIds` set — only matching rows returned.
- Unit: `GetQueueDetailUseCase` — record outside `allowedBranchIds` → `QueueNotFoundException`.
- Integration: authenticated request scoped to Branch A does not see Branch B's queue entries.

## Deliverables

`resolveQueueScope.ts`, repository/use-case/controller wiring, tests.

## Acceptance Criteria

- A non-cross-branch user's `GET /queues` never returns rows from a branch they aren't assigned to.
- A cross-branch role (Owner/Administrator/Security Admin) sees all branches, unchanged from today.
- Requesting the detail of an out-of-scope Queue record returns 404, not 200 or 403.

## Definition of Done

Branch scoping enforced on List/Detail/Dashboard, tests passing, SAD/business-rules updated.

---

## Dependency Detail

- **Blocked By:** task-037, task-038, task-039, task-047
- **Required Before:** task-312 (extends the same scope resolution with doctor restriction), task-314 (Detail view relies on correctly-scoped data)
- **Can Run In Parallel With:** task-313
