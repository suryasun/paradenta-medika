# task-212: Default Branch Resolution Policy

**Phase:** Phase 4 - Multi Branch Platform
**Epic:** BA. Multi Branch Configuration
**Feature:** BA2. Default Branch Policy
**Module:** Master Data
**Priority:** P1 - High

---

## Business Goal

Implement `ResolveDefaultBranchUseCase`, a shared domain service realizing the Branch business rule 'Default Branch ditentukan melalui System Parameter' (docs/03-sad/11-module-master-data.md Section 11.2), so every branch-scoped workflow (Reservation, Queue, Billing, Warehouse, Finance) has one authoritative way to resolve which branch applies when a request does not explicitly specify one.

## Depends On

- task-022 (Branch Entity)
- task-200 (System Parameter)
- task-013 (Authentication Middleware)
- task-014 (Authorization Middleware)
- task-006 (Audit Trail Service)

## Required Documents

- **AI Contract:** docs/04-ai-contract/07-module-contract.md, docs/04-ai-contract/04-api-contract.md, docs/04-ai-contract/06-database-contract.md
- **PRD:** docs/01-prd/features/master-data.md, docs/01-prd/business-rules.md § 1
- **SAD:** docs/03-sad/11-module-master-data.md (Section 11.2 Branch (Business Rules: 'Default Branch ditentukan melalui System Parameter')) and docs/03-sad/21-module-system.md Section 4.4 UC-SYS-003 Update System Parameter
- **Design:** No page-level spec exists yet (documented gap in docs/02-design/pages/overview.md) — follow CLAUDE.md frontend rules until a design spec exists.

## Required Existing Code

task-022, task-200, task-013, task-014.

## Backend Scope

- Domain layer: `ResolveDefaultBranchUseCase` — reads the user's default branch assignment (task-210) first; if absent, falls back to the clinic-level default configured via a `masterdata.branch.default` System Parameter (task-200/202/203's Approve Configuration Change Request flow governs changing this parameter).
- Exposed as an internal service function other modules' controllers call when a request omits an explicit branchId, not as a new public endpoint.

## Frontend Scope

No dedicated page in this task; backend-only per Backend Scope. Any UI consuming this endpoint is scoped to a later frontend task once docs/02-design coverage exists.

## Database Impact

Read-only; reads system_user_branches (task-210) and system_parameters (task-200).

## API Impact

None (internal domain service, no new endpoint).

## Workflow Impact

Every branch-scoped endpoint across Reservation, Queue, Billing, Warehouse, and Finance that accepts an optional branchId should call this service instead of re-implementing default-branch logic ad hoc — this task establishes the single source of truth.

## Security Impact

No direct endpoint; the resolved branch is still subject to the caller's normal branch-scope authorization check.

## Testing Required

- Unit tests for the Use Case/Entity (per docs/05-testing/unit-tests.md).
- Integration test for Controller/Repository (per docs/05-testing/api-tests.md).

## Deliverables

- `ResolveDefaultBranchUseCase` domain service
- Unit tests covering user-default-present and clinic-fallback paths

## Acceptance Criteria

Per docs/01-prd/acceptance-criteria/master-data.md:

- When a user has a default branch assignment, it is used.
- When absent, the clinic-level `masterdata.branch.default` System Parameter is used.
- When neither exists, the caller receives an explicit error rather than a silently guessed branch.

## Definition of Done

Domain service implemented and unit-tested against both resolution paths and the no-default error case.

---

## Dependency Detail

- **Blocked By:** task-022, task-200
- **Required Before:** See phase-4-plan.md Implementation Order.
- **Can Run In Parallel With:** Tasks in other Epics once own dependencies are satisfied.
