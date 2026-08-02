# task-193: Activity Log Query (GET /system/activity-logs)

**Phase:** Phase 3 - Operational Excellence
**Epic:** AI. Audit Dashboard
**Feature:** AI1. Audit and Activity Inspection
**Module:** System
**Priority:** P2 - Medium

---

## Business Goal

Implement `QueryActivityLogsUseCase` per docs/03-sad/21-module-system.md Section 6.3, exposing the lighter-weight activity log distinct from the compliance-grade Audit Log.

## Depends On

- task-192 (Audit Log Query)

## Required Documents

- **AI Contract:** docs/04-ai-contract/07-module-contract.md, docs/04-ai-contract/04-api-contract.md, docs/04-ai-contract/06-database-contract.md, docs/04-ai-contract/09-security-contract.md, docs/04-ai-contract/05-auth-contract.md
- **PRD:** docs/01-prd/features/system.md, docs/01-prd/business-rules.md § 10
- **SAD:** docs/03-sad/21-module-system.md (Section 6.3 Notifications, Audit, and Operations, Section 5.4 Notification, Audit, and Shared Operations)
- **Design:** No page-level spec exists yet (documented gap in docs/02-design/pages/overview.md) — follow CLAUDE.md frontend rules until a design spec exists.

## Required Existing Code

task-192, task-013, task-014.

## Backend Scope

- Presentation layer: route, controller for `GET /system/activity-logs`.
- Application layer: `QueryActivityLogsUseCase`.

## Frontend Scope

No dedicated page in this task; backend-only per Backend Scope. Any UI consuming this endpoint is scoped to a later frontend task once docs/02-design coverage exists.

## Database Impact

Read-only; queries the activity_logs table.

## API Impact

Adds GET /system/activity-logs.

## Workflow Impact

Supports the Audit Dashboard's operational (non-compliance) activity feed.

## Security Impact

Gated by an activity-log-read permission; scope limited per role (Section 4.1 Actor Matrix: Clinic Manager gets 'limited' access).

## Testing Required

- Unit tests for the Use Case/Entity (per docs/05-testing/unit-tests.md).
- Integration test for Controller/Repository (per docs/05-testing/api-tests.md).

## Deliverables

- `QueryActivityLogsUseCase`, route, controller, tests

## Acceptance Criteria

Per docs/01-prd/acceptance-criteria/system.md (sourced from docs/03-sad/21-module-system.md):

- Clinic Manager role receives a limited view per the Actor Matrix; Administrator/Security Admin/Owner receive full access.

## Definition of Done

Endpoint implemented and tested.

---

## Dependency Detail

- **Blocked By:** task-192
- **Required Before:** See phase-3-plan.md Implementation Order.
- **Can Run In Parallel With:** Tasks in other Epics once own dependencies are satisfied.
