# task-197: Notification (Entity, Migration & GET /system/notifications)

**Phase:** Phase 3 - Operational Excellence
**Epic:** AJ. Notification Center
**Feature:** AJ2. Notification Inbox
**Module:** System
**Priority:** P1 - High

---

## Business Goal

Create the `Notification` entity/migration and `ListNotificationsUseCase` for `GET /system/notifications`, the per-recipient inbox that UC-SYS-005 delivery targets.

## Depends On

- task-195

## Required Documents

- **AI Contract:** docs/04-ai-contract/07-module-contract.md, docs/04-ai-contract/04-api-contract.md, docs/04-ai-contract/06-database-contract.md, docs/04-ai-contract/09-security-contract.md, docs/04-ai-contract/05-auth-contract.md
- **PRD:** docs/01-prd/features/system.md, docs/01-prd/business-rules.md § 10
- **SAD:** docs/03-sad/21-module-system.md (Section 5.4 Data Model, Section 6.3 API)
- **Design:** No page-level spec exists yet (documented gap in docs/02-design/pages/overview.md) — follow CLAUDE.md frontend rules until a design spec exists.

## Required Existing Code

task-195, task-013, task-014, task-006.

## Backend Scope

- Domain layer: `Notification` entity (recipientId, templateId, channel, status queued/sent/failed/read, payload).
- Infrastructure layer: Prisma migration for `system_notifications`; `INotificationRepository` + Prisma implementation.
- Application layer: `ListNotificationsUseCase` for `GET /system/notifications`.

## Frontend Scope

No dedicated page in this task; backend-only per Backend Scope. Any UI consuming this endpoint is scoped to a later frontend task once docs/02-design coverage exists.

## Database Impact

Creates system_notifications table.

## API Impact

Adds GET /system/notifications.

## Workflow Impact

Recipient-facing inbox for UC-SYS-005 deliveries.

## Security Impact

A user can only list their own notifications.

## Testing Required

- Unit tests for the Use Case/Entity (per docs/05-testing/unit-tests.md).
- Integration test for Controller/Repository (per docs/05-testing/api-tests.md).

## Deliverables

- `Notification` entity, migration, repository
- `ListNotificationsUseCase`, route, controller, tests

## Acceptance Criteria

Per docs/01-prd/acceptance-criteria/system.md (sourced from docs/03-sad/21-module-system.md):

- List is scoped strictly to the authenticated recipient.

## Definition of Done

Entity, migration, and list endpoint implemented and tested.

---

## Dependency Detail

- **Blocked By:** task-195
- **Required Before:** See phase-3-plan.md Implementation Order.
- **Can Run In Parallel With:** Tasks in other Epics once own dependencies are satisfied.
