# task-210: Assign Branch to User (POST /system/users/{userId}/branches)

**Phase:** Phase 4 - Multi Branch Platform
**Epic:** BA. Multi Branch Configuration
**Feature:** BA1. Branch Assignment
**Module:** System
**Priority:** P0 - Blocking

---

## Business Goal

Implement the dedicated `AssignUserBranchUseCase` for `POST /system/users/{userId}/branches` (`system.user.branch.manage`), the literal endpoint listed in docs/03-sad/21-module-system.md Section 6.1 that was not built as its own task in Phase 1 (task-019 only covered the combined /roles payload example, which is a distinct endpoint from /branches per the API table). This delivers the roadmap Phase 4 'Multi Branch Configuration' and 'Centralized User Management' capabilities' foundation: assigning a user to one or more branches with a designated default branch.

## Depends On

- task-019 (Assign Role to User)
- task-022 (Branch Entity)
- task-013 (Authentication Middleware)
- task-014 (Authorization Middleware)
- task-006 (Audit Trail Service)

## Required Documents

- **AI Contract:** docs/04-ai-contract/07-module-contract.md, docs/04-ai-contract/04-api-contract.md, docs/04-ai-contract/06-database-contract.md, docs/04-ai-contract/09-security-contract.md, docs/04-ai-contract/05-auth-contract.md
- **PRD:** docs/01-prd/features/system.md, docs/01-prd/business-rules.md § 10
- **SAD:** docs/03-sad/21-module-system.md (Section 6.1 User and Access Administration (endpoint table), Section 4.3 UC-SYS-002 Change Role or Branch Scope)
- **Design:** No page-level spec exists yet (documented gap in docs/02-design/pages/overview.md) — follow CLAUDE.md frontend rules until a design spec exists.

## Required Existing Code

task-019, task-022, task-013, task-014, task-006.

## Backend Scope

- Application layer: `AssignUserBranchUseCase` — validates each branchId exists and is active, enforces exactly one `isDefault: true` entry per the Role assignment example shape (`branchAssignments: [{branchId, isDefault, effectiveFrom}]`), and rejects self-escalation (a user cannot grant themselves a new branch) per UC-SYS-002's 'no self-escalation policy'.
- Infrastructure layer: Prisma migration for `system_user_branches` (userId, branchId, isDefault, effectiveFrom) if not already covered by task-019's `user_roles`/branch-assignment schema — this task must confirm whether task-019 already created a suitable table before adding a new one (see Ambiguity note in Definition of Done).
- On effective time, invalidates the user's permission cache and requests a claim/session refresh from Authentication, per UC-SYS-002 step 4.

## Frontend Scope

No dedicated page in this task; backend-only per Backend Scope. Any UI consuming this endpoint is scoped to a later frontend task once docs/02-design coverage exists.

## Database Impact

Writes to the user-branch assignment table (system_user_branches, or extends the table task-019 created — to be confirmed at implementation time).

## API Impact

Adds POST /system/users/{userId}/branches.

## Workflow Impact

Realizes UC-SYS-002 Change Role or Branch Scope for the branch-assignment half of the workflow; required before any Phase 4 branch-scoped dashboard/report can meaningfully restrict a user to specific branches.

## Security Impact

Gated by `system.user.branch.manage`. Rejects self-escalation. `SYS_BRANCH_SCOPE_INVALID` (422) returned for an invalid default/assigned branch. Audit Trail entry required with old/new mappings and correlation id per UC-SYS-002 step 5.

## Testing Required

- Unit tests for the Use Case/Entity (per docs/05-testing/unit-tests.md).
- Integration test for Controller/Repository (per docs/05-testing/api-tests.md).

## Deliverables

- `AssignUserBranchUseCase`, route, controller, DTOs, tests
- Migration (if a new table is required, see Ambiguity)

## Acceptance Criteria

Per docs/01-prd/acceptance-criteria/system.md:

- `SYS_BRANCH_SCOPE_INVALID` returned for a non-existent or inactive branch.
- Exactly one branch assignment is flagged `isDefault: true`.
- Self-escalation is rejected.
- Audit record contains old/new mappings and correlation id.

## Definition of Done

Endpoint implemented and tested. **Ambiguity flagged (see phase-4-plan.md):** task-019 (Phase 1) already accepts a `branchAssignments` array in the same request body as role assignment, per the Section 6.1 example payload, even though the API table lists `/roles` and `/branches` as two separate endpoints with two separate permissions (`system.user.role.manage` vs `system.user.branch.manage`). This task builds the literal `/branches` endpoint as specified in the table; the overlap with task-019's existing behaviour must be reconciled during implementation (either task-019 is narrowed to roles-only, or this task becomes a thin wrapper delegating to the same underlying assignment table) rather than guessed here.

---

## Dependency Detail

- **Blocked By:** task-019, task-022, task-013, task-014, task-006
- **Required Before:** See phase-4-plan.md Implementation Order.
- **Can Run In Parallel With:** Tasks in other Epics once own dependencies are satisfied.
