# task-213: Branch Configuration View (GET /system/branches/{branchId}/configuration)

**Phase:** Phase 4 - Multi Branch Platform
**Epic:** BA. Multi Branch Configuration
**Feature:** BA2. Default Branch Policy
**Module:** System
**Priority:** P2 - Medium

---

## Business Goal

Implement `GetBranchConfigurationUseCase`, aggregating every branch-scoped System Parameter (task-200, scope=branch) into one consolidated read view, so an Administrator can audit a single branch's effective configuration without querying each parameter key individually — the 'Multi Branch Configuration' roadmap capability's primary read surface.

## Depends On

- task-022 (Branch Entity)
- task-200 (System Parameter)

## Required Documents

- **AI Contract:** docs/04-ai-contract/07-module-contract.md, docs/04-ai-contract/04-api-contract.md, docs/04-ai-contract/06-database-contract.md, docs/04-ai-contract/09-security-contract.md, docs/04-ai-contract/05-auth-contract.md
- **PRD:** docs/01-prd/features/system.md, docs/01-prd/business-rules.md § 10
- **SAD:** docs/03-sad/21-module-system.md (Section 6.2 Parameters, Flags, Menus, and Templates (convention-derived aggregation endpoint), Section 3.4 Configuration Rules)
- **Design:** No page-level spec exists yet (documented gap in docs/02-design/pages/overview.md) — follow CLAUDE.md frontend rules until a design spec exists.

## Required Existing Code

task-022, task-200, task-013, task-014.

## Backend Scope

- Presentation layer: route, controller for `GET /system/branches/{branchId}/configuration` (path derived from the documented URL convention — no literal aggregation endpoint is enumerated in Section 6.2's table).
- Application layer: `GetBranchConfigurationUseCase`, queries all `system_parameters` rows whose scope is `{type: branch, id: branchId}` plus clinic-level parameters not overridden at branch level.

## Frontend Scope

No dedicated page in this task; backend-only per Backend Scope. Any UI consuming this endpoint is scoped to a later frontend task once docs/02-design coverage exists.

## Database Impact

Read-only; queries system_parameters.

## API Impact

Adds GET /system/branches/{branchId}/configuration.

## Workflow Impact

Supports Multi Branch Configuration auditing and onboarding-verification for newly created branches (see task-223).

## Security Impact

Gated by a parameter-read permission, branch-scoped.

## Testing Required

- Unit tests for the Use Case/Entity (per docs/05-testing/unit-tests.md).
- Integration test for Controller/Repository (per docs/05-testing/api-tests.md).

## Deliverables

- `GetBranchConfigurationUseCase`, route, controller, tests

## Acceptance Criteria

Per docs/01-prd/acceptance-criteria/system.md:

- Response distinguishes branch-level overrides from inherited clinic-level defaults.

## Definition of Done

Endpoint implemented and tested. **Ambiguity flagged:** this endpoint path is convention-derived, not literal in the SAD.

---

## Dependency Detail

- **Blocked By:** task-022, task-200
- **Required Before:** See phase-4-plan.md Implementation Order.
- **Can Run In Parallel With:** Tasks in other Epics once own dependencies are satisfied.
