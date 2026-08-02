# task-214: Cross-Branch User Directory (GET /system/users with branch filter)

**Phase:** Phase 4 - Multi Branch Platform
**Epic:** BB. Centralized User Management
**Feature:** BB1. User Directory
**Module:** System
**Priority:** P1 - High

---

## Business Goal

Extend `ListUsersUseCase` (task-015) with a `branchId` filter and a cross-branch 'all users, all branches' view for Administrator/Owner, delivering the roadmap 'Centralized User Management' capability — a single directory instead of per-branch silos.

## Depends On

- task-015 (User List & Create)
- task-210 (Assign Branch to User)

## Required Documents

- **AI Contract:** docs/04-ai-contract/07-module-contract.md, docs/04-ai-contract/04-api-contract.md, docs/04-ai-contract/06-database-contract.md, docs/04-ai-contract/09-security-contract.md, docs/04-ai-contract/05-auth-contract.md
- **PRD:** docs/01-prd/features/system.md, docs/01-prd/business-rules.md § 10
- **SAD:** docs/03-sad/21-module-system.md (Section 6.1 User and Access Administration, Section 4.1 Actor Matrix (Administrator: full scope; Clinic Manager: scoped))
- **Design:** No page-level spec exists yet (documented gap in docs/02-design/pages/overview.md) — follow CLAUDE.md frontend rules until a design spec exists.

## Required Existing Code

task-015, task-210, task-013, task-014.

## Backend Scope

- Application layer: extend `ListUsersUseCase` with an optional `branchId` query parameter that joins against the user-branch assignment table; when omitted, an Administrator/Owner sees every user across every branch, while a Clinic Manager's result is intersected with their own assigned branch(es) per the Actor Matrix.

## Frontend Scope

No dedicated page in this task; backend-only per Backend Scope. Any UI consuming this endpoint is scoped to a later frontend task once docs/02-design coverage exists.

## Database Impact

Read-only; extends the existing users query with a join to system_user_branches.

## API Impact

Extends GET /system/users with a branchId filter parameter (no new route).

## Workflow Impact

Centralizes what would otherwise require querying each branch separately.

## Security Impact

Scope intersected with the requester's own branch assignment unless they hold a cross-branch permission (Administrator/Owner) per the Actor Matrix — never silently widened.

## Testing Required

- Unit tests for the Use Case/Entity (per docs/05-testing/unit-tests.md).
- Integration test for Controller/Repository (per docs/05-testing/api-tests.md).

## Deliverables

- Updated `ListUsersUseCase`, updated DTO/query validator, tests

## Acceptance Criteria

Per docs/01-prd/acceptance-criteria/system.md:

- A Clinic Manager's unfiltered request is automatically intersected with their assigned branch(es), not the full directory.
- An Administrator's unfiltered request returns users across all branches.

## Definition of Done

Use case extended and tested against both the Administrator (full) and Clinic Manager (scoped) paths.

---

## Dependency Detail

- **Blocked By:** task-015, task-210
- **Required Before:** See phase-4-plan.md Implementation Order.
- **Can Run In Parallel With:** Tasks in other Epics once own dependencies are satisfied.
