# task-312: Doctor Self-Scoping for Queue

**Phase:** Queue Module Addendum #1 (post-roadmap)
**Epic:** QA. Queue Module Enhancement
**Feature:** QA2. Doctor-Scoped Queue Visibility
**Module:** Queue
**Priority:** P1 - High

---

## Business Goal

A user with the Doctor role should only see their own patients on the Queue board — not every doctor's queue at the branch. Queue's existing ownership model is "Active Clinic" (branch) only (SAD Auth §27.4); this extends the same Doctor-Assigned ownership pattern already used for EMR/Visit to Queue.

## Depends On

- task-311 (branch scoping — shares `resolveQueueScope`)

## Required Documents

- **AI Contract:** `docs/04-ai-contract/05-auth-contract.md` RBAC-013 (Doctor EMR/assigned-resource ownership validation)
- **SAD:** `docs/03-sad/14-module-queue.md` §29.1.2; `docs/03-sad/10-authentication.md` §27.4 ownership table
- **Business Rules:** `docs/01-prd/business-rules.md` "Queue Module Addendum #1"

## Required Existing Code

`resolveQueueScope.ts` (task-311), `IDoctorRepository.findByUserId` (`apps/backend/src/modules/master-data/infrastructure/repositories/DoctorRepository.ts`), canonical Doctor role-code constant (verify exact string in `apps/backend/src/modules/auth` before use).

## Backend Scope

- `resolveQueueScope.ts` extended: when `roleCodes` includes the Doctor role code, resolve `restrictToDoctorId` via `doctorRepository.findByUserId(userId)`. If the user holds the Doctor role but has no linked `Doctor` record, `restrictToDoctorId` resolves to a sentinel that yields an empty result set (not an error) — a Doctor-role login without a Doctor profile should see nothing, not crash or see everything.
- `IQueueRepository.ts` / `QueueRepository.ts`: `QueueListFilters` gains `restrictToDoctorId?: string`; `search()`'s `where` combines it with any existing user-supplied `filters.doctorId` query param via an explicit `AND` clause (not object-key overwrite), so a Doctor cannot widen their own scope by passing a different `doctorId` query param.
- `GetQueueDetailUseCase.ts`: record whose `doctorId !== restrictToDoctorId` (when set) also throws `QueueNotFoundException`.
- `QueueDashboardUseCase.ts`: dashboard metrics also narrow to the doctor's own entries for consistency with the board.

## Frontend Scope

None — filtering is fully server-side; no UI conditional needed.

## Database Impact

None.

## API Impact

`GET /queues`, `GET /queues/:id`, `GET /queues/dashboard` responses for a Doctor-role caller are additionally narrowed to `doctorId = own`. No new query params.

## Workflow Impact

None.

## Security Impact

Enforces RBAC-013-style ownership validation on Queue, previously undocumented/unenforced for this resource.

## Testing Required

- Unit: `resolveQueueScope` — Doctor role resolves `restrictToDoctorId`; Doctor role with no linked `Doctor` record resolves to an empty-result sentinel, not a thrown error.
- Unit: `QueueRepository.search` — combined `allowedBranchIds` + `restrictToDoctorId` + explicit `filters.doctorId` query param interact correctly (AND, not overwrite).
- Unit: `GetQueueDetailUseCase` — another doctor's Queue entry → `QueueNotFoundException`.

## Deliverables

`resolveQueueScope.ts` doctor-restriction logic, repository/use-case wiring, tests.

## Acceptance Criteria

- A Doctor-role user's `GET /queues` only returns entries where `doctorId` is their own.
- Non-Doctor roles (Admin, Manager, Registration, Nurse) are unaffected by this restriction.
- A Doctor-role user with no linked Doctor profile sees an empty board, not an error and not everyone's queue.

## Definition of Done

Doctor self-scoping enforced on List/Detail/Dashboard, tests passing.

---

## Dependency Detail

- **Blocked By:** task-311
- **Required Before:** task-314 (Detail view relies on correctly-scoped data)
- **Can Run In Parallel With:** task-313
