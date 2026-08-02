# task-203: Approve Configuration Change Request (POST /configuration-change-requests/{requestId}/approve)

**Phase:** Phase 3 - Operational Excellence
**Epic:** AK. Approval Workflow
**Feature:** AK2. Configuration Change Approval
**Module:** System
**Priority:** P0 - Blocking

---

## Business Goal

Implement `ApproveConfigurationChangeRequestUseCase`, the core of the roadmap 'Approval Workflow' feature — completes UC-SYS-003 by activating the new parameter version, invalidating cache, and publishing `system.configuration.changed.v1`.

## Depends On

- task-202 (Parameter Change Request)

## Required Documents

- **AI Contract:** docs/04-ai-contract/07-module-contract.md, docs/04-ai-contract/04-api-contract.md, docs/04-ai-contract/06-database-contract.md, docs/04-ai-contract/09-security-contract.md, docs/04-ai-contract/05-auth-contract.md
- **PRD:** docs/01-prd/features/system.md, docs/01-prd/business-rules.md § 10
- **SAD:** docs/03-sad/21-module-system.md (Section 4.4 UC-SYS-003 Update System Parameter, Section 6.4 Error Codes)
- **Design:** No page-level spec exists yet (documented gap in docs/02-design/pages/overview.md) — follow CLAUDE.md frontend rules until a design spec exists.

## Required Existing Code

task-202, task-013, task-014, task-006.

## Backend Scope

- Presentation layer: route, controller for `POST /system/configuration-change-requests/{requestId}/approve`.
- Application layer: `ApproveConfigurationChangeRequestUseCase` — independent approver required (approver ≠ requester); on approval, writes an immutable new SystemParameter version, publishes `system.configuration.changed.v1`, and invalidates relevant cache per the UC-SYS-003 flowchart.

## Frontend Scope

No dedicated page in this task; backend-only per Backend Scope. Any UI consuming this endpoint is scoped to a later frontend task once docs/02-design coverage exists.

## Database Impact

Inserts a new system_parameters version row; updates system_configuration_change_requests status to approved.

## API Impact

Adds POST /system/configuration-change-requests/{requestId}/approve.

## Workflow Impact

Terminal 'Activate' step of the UC-SYS-003 flowchart, realizing the roadmap 'Approval Workflow' feature.

## Security Impact

`SYS_CONFIG_APPROVAL_REQUIRED` (403) if the requester attempts to approve their own request. Audit Trail entry required.

## Testing Required

- Unit tests for the Use Case/Entity (per docs/05-testing/unit-tests.md).
- Integration test for Controller/Repository (per docs/05-testing/api-tests.md).

## Deliverables

- `ApproveConfigurationChangeRequestUseCase`, route, controller, tests
- `system.configuration.changed.v1` event publisher

## Acceptance Criteria

Per docs/01-prd/acceptance-criteria/system.md (sourced from docs/03-sad/21-module-system.md):

- Self-approval rejected with `SYS_CONFIG_APPROVAL_REQUIRED`.
- Event `system.configuration.changed.v1` published exactly once per approval.

## Definition of Done

Use case implemented and tested against the self-approval rejection and event publication.

---

## Dependency Detail

- **Blocked By:** task-202
- **Required Before:** See phase-3-plan.md Implementation Order.
- **Can Run In Parallel With:** Tasks in other Epics once own dependencies are satisfied.
