# task-195: Notification Template (Entity, Migration & CRUD)

**Phase:** Phase 3 - Operational Excellence
**Epic:** AJ. Notification Center
**Feature:** AJ1. Templates
**Module:** System
**Priority:** P1 - High

---

## Business Goal

Create the `NotificationTemplate` entity/migration and `GET/POST /system/notification-templates` per docs/03-sad/21-module-system.md UC-SYS-005 Notification Template and Delivery, delivering the roadmap 'Notification Center' feature.

## Depends On

- task-013 (Authentication Middleware)
- task-014 (Authorization Middleware)
- task-006 (Audit Trail Service)

## Required Documents

- **AI Contract:** docs/04-ai-contract/07-module-contract.md, docs/04-ai-contract/04-api-contract.md, docs/04-ai-contract/06-database-contract.md, docs/04-ai-contract/09-security-contract.md, docs/04-ai-contract/05-auth-contract.md
- **PRD:** docs/01-prd/features/system.md, docs/01-prd/business-rules.md § 10
- **SAD:** docs/03-sad/21-module-system.md (Section 4.6 UC-SYS-005 Notification Template and Delivery, Section 5.4 Data Model, Section 6.2 API)
- **Design:** No page-level spec exists yet (documented gap in docs/02-design/pages/overview.md) — follow CLAUDE.md frontend rules until a design spec exists.

## Required Existing Code

task-013, task-014, task-006.

## Backend Scope

- Domain layer: `NotificationTemplate` entity (versioned, channel, locale, variable schema, content classification).
- Infrastructure layer: Prisma migration for `system_notification_templates`; `INotificationTemplateRepository` + Prisma implementation.
- Application layer: `CreateNotificationTemplateUseCase`, `ListNotificationTemplatesUseCase`.

## Frontend Scope

No dedicated page in this task; backend-only per Backend Scope. Any UI consuming this endpoint is scoped to a later frontend task once docs/02-design coverage exists.

## Database Impact

Creates system_notification_templates table.

## API Impact

Adds GET/POST /system/notification-templates.

## Workflow Impact

First step of UC-SYS-005 Notification Template and Delivery.

## Security Impact

Gated by an administrator-scoped template-manage permission. Variable/escaping validated per UC-SYS-005; unsafe content blocked per channel policy.

## Testing Required

- Unit tests for the Use Case/Entity (per docs/05-testing/unit-tests.md).
- Integration test for Controller/Repository (per docs/05-testing/api-tests.md).

## Deliverables

- `NotificationTemplate` entity, migration, repository
- `CreateNotificationTemplateUseCase`, `ListNotificationTemplatesUseCase`, route, controller, tests

## Acceptance Criteria

Per docs/01-prd/acceptance-criteria/system.md (sourced from docs/03-sad/21-module-system.md):

- Template creation validates variable schema/escaping and rejects unsafe content per channel policy.

## Definition of Done

Entity, migration, and CRUD endpoints implemented and tested.

---

## Dependency Detail

- **Blocked By:** task-013, task-014, task-006
- **Required Before:** See phase-3-plan.md Implementation Order.
- **Can Run In Parallel With:** Tasks in other Epics once own dependencies are satisfied.
