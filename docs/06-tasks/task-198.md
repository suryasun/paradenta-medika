# task-198: Mark Notification Read (POST /notifications/{notificationId}/read)

**Phase:** Phase 3 - Operational Excellence
**Epic:** AJ. Notification Center
**Feature:** AJ2. Notification Inbox
**Module:** System
**Priority:** P2 - Medium

---

## Business Goal

Implement `MarkNotificationReadUseCase` per docs/03-sad/21-module-system.md Section 6.3.

## Depends On

- task-197

## Required Documents

- **AI Contract:** docs/04-ai-contract/07-module-contract.md, docs/04-ai-contract/04-api-contract.md, docs/04-ai-contract/06-database-contract.md, docs/04-ai-contract/09-security-contract.md, docs/04-ai-contract/05-auth-contract.md
- **PRD:** docs/01-prd/features/system.md, docs/01-prd/business-rules.md § 10
- **SAD:** docs/03-sad/21-module-system.md (Section 6.3 Notifications, Audit, and Operations)
- **Design:** No page-level spec exists yet (documented gap in docs/02-design/pages/overview.md) — follow CLAUDE.md frontend rules until a design spec exists.

## Required Existing Code

task-197, task-013, task-014.

## Backend Scope

- Presentation layer: route, controller for `POST /system/notifications/{notificationId}/read`.
- Application layer: `MarkNotificationReadUseCase`.

## Frontend Scope

No dedicated page in this task; backend-only per Backend Scope. Any UI consuming this endpoint is scoped to a later frontend task once docs/02-design coverage exists.

## Database Impact

Updates system_notifications.status/readAt.

## API Impact

Adds POST /system/notifications/{notificationId}/read.

## Workflow Impact

Inbox interaction step of the Notification Center feature.

## Security Impact

A user can only mark their own notifications as read.

## Testing Required

- Unit tests for the Use Case/Entity (per docs/05-testing/unit-tests.md).
- Integration test for Controller/Repository (per docs/05-testing/api-tests.md).

## Deliverables

- `MarkNotificationReadUseCase`, route, controller, tests

## Acceptance Criteria

Per docs/01-prd/acceptance-criteria/system.md (sourced from docs/03-sad/21-module-system.md):

- 403/404 when attempting to mark another recipient's notification as read.

## Definition of Done

Endpoint implemented and tested.

---

## Dependency Detail

- **Blocked By:** task-197
- **Required Before:** See phase-3-plan.md Implementation Order.
- **Can Run In Parallel With:** Tasks in other Epics once own dependencies are satisfied.
