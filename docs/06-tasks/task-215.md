# task-215: Branch-Scoped Role Assignment Matrix (GET /system/roles/branch-matrix)

**Phase:** Phase 4 - Multi Branch Platform
**Epic:** BB. Centralized User Management
**Feature:** BB2. Role-Branch Overview
**Module:** System
**Priority:** P2 - Medium

---

## Business Goal

Implement `GetRoleBranchMatrixUseCase`, a consolidated view of which roles are assigned to which users in which branches, so an Administrator can audit role distribution across the whole multi-branch platform in one screen rather than branch-by-branch.

## Depends On

- task-017 (Role List & Create)
- task-210 (Assign Branch to User)

## Required Documents

- **AI Contract:** docs/04-ai-contract/07-module-contract.md, docs/04-ai-contract/04-api-contract.md, docs/04-ai-contract/06-database-contract.md, docs/04-ai-contract/09-security-contract.md, docs/04-ai-contract/05-auth-contract.md
- **PRD:** docs/01-prd/features/system.md, docs/01-prd/business-rules.md § 10
- **SAD:** docs/03-sad/21-module-system.md (Section 4.1 Actor Matrix, Section 6.1 User and Access Administration (convention-derived aggregation endpoint))
- **Design:** No page-level spec exists yet (documented gap in docs/02-design/pages/overview.md) — follow CLAUDE.md frontend rules until a design spec exists.

## Required Existing Code

task-017, task-210, task-013, task-014.

## Backend Scope

- Presentation layer: route, controller for `GET /system/roles/branch-matrix` (convention-derived; not a literal endpoint in Section 6.1's table).
- Application layer: `GetRoleBranchMatrixUseCase`, aggregates role × branch × user-count.

## Frontend Scope

No dedicated page in this task; backend-only per Backend Scope. Any UI consuming this endpoint is scoped to a later frontend task once docs/02-design coverage exists.

## Database Impact

Read-only; aggregates user_roles and system_user_branches.

## API Impact

Adds GET /system/roles/branch-matrix.

## Workflow Impact

Supports Centralized User Management governance and Branch-Level Access Control auditing (Epic BC).

## Security Impact

Gated by an administrator-scoped role-read permission; result respects cross-branch vs scoped access per the Actor Matrix.

## Testing Required

- Unit tests for the Use Case/Entity (per docs/05-testing/unit-tests.md).
- Integration test for Controller/Repository (per docs/05-testing/api-tests.md).

## Deliverables

- `GetRoleBranchMatrixUseCase`, route, controller, tests

## Acceptance Criteria

Per docs/01-prd/acceptance-criteria/system.md:

- Matrix correctly reflects concurrent multi-branch assignments for a single user.

## Definition of Done

Endpoint implemented and tested. **Ambiguity flagged:** convention-derived path, not literal in the SAD.

---

## Dependency Detail

- **Blocked By:** task-017, task-210
- **Required Before:** See phase-4-plan.md Implementation Order.
- **Can Run In Parallel With:** Tasks in other Epics once own dependencies are satisfied.
