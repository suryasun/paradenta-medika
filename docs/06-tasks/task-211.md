# task-211: List User's Branch Memberships (GET /system/users/{userId}/branches)

**Phase:** Phase 4 - Multi Branch Platform
**Epic:** BA. Multi Branch Configuration
**Feature:** BA1. Branch Assignment
**Module:** System
**Priority:** P1 - High

---

## Business Goal

Implement `ListUserBranchesUseCase` so an Administrator or the user's own profile page can see which branches a user is assigned to and which is default — a companion read endpoint to task-210, applying the documented URL convention since the SAD's Section 6.1 table lists the assignment endpoint but not an explicit GET counterpart.

## Depends On

- task-210 (Assign Branch to User)

## Required Documents

- **AI Contract:** docs/04-ai-contract/07-module-contract.md, docs/04-ai-contract/04-api-contract.md, docs/04-ai-contract/06-database-contract.md, docs/04-ai-contract/09-security-contract.md, docs/04-ai-contract/05-auth-contract.md
- **PRD:** docs/01-prd/features/system.md, docs/01-prd/business-rules.md § 10
- **SAD:** docs/03-sad/21-module-system.md (Section 6.1 User and Access Administration (convention-derived GET counterpart))
- **Design:** No page-level spec exists yet (documented gap in docs/02-design/pages/overview.md) — follow CLAUDE.md frontend rules until a design spec exists.

## Required Existing Code

task-210, task-013, task-014.

## Backend Scope

- Presentation layer: route, controller for `GET /system/users/{userId}/branches` (path derived from the documented REST convention in docs/04-ai-contract/04-api-contract.md, since the SAD's endpoint table does not enumerate a literal GET path for this resource — same convention-derivation precedent as Phase 1 task-021/task-022).
- Application layer: `ListUserBranchesUseCase`.

## Frontend Scope

No dedicated page in this task; backend-only per Backend Scope. Any UI consuming this endpoint is scoped to a later frontend task once docs/02-design coverage exists.

## Database Impact

Read-only; queries the user-branch assignment table from task-210.

## API Impact

Adds GET /system/users/{userId}/branches.

## Workflow Impact

Supports the User Detail page's branch-assignment display and any branch-switch UI.

## Security Impact

Gated by `system.user.read`, or self-read for the authenticated user's own branches.

## Testing Required

- Unit tests for the Use Case/Entity (per docs/05-testing/unit-tests.md).
- Integration test for Controller/Repository (per docs/05-testing/api-tests.md).

## Deliverables

- `ListUserBranchesUseCase`, route, controller, tests

## Acceptance Criteria

Per docs/01-prd/acceptance-criteria/system.md:

- Response includes each assigned branch and flags the default branch.
- A user can always read their own branch list regardless of `system.user.read`.

## Definition of Done

Endpoint implemented and tested.

---

## Dependency Detail

- **Blocked By:** task-210
- **Required Before:** See phase-4-plan.md Implementation Order.
- **Can Run In Parallel With:** Tasks in other Epics once own dependencies are satisfied.
