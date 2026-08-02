# task-199: Notification Delivery Worker (Reminder Notification Automation)

**Phase:** Phase 3 - Operational Excellence
**Epic:** AJ. Notification Center
**Feature:** AJ3. Delivery Worker
**Module:** System
**Priority:** P0 - Blocking

---

## Business Goal

Implement the delivery worker completing UC-SYS-005 Notification Template and Delivery — domain modules request a notification with a template key and approved payload, the worker renders, queues, sends via a provider adapter, records attempts/status, and retries/dead-letters — delivering the roadmap Phase 3 Automation item 'Reminder Notification'.

## Depends On

- task-195
- task-197
- task-013 (Authentication Middleware)
- task-014 (Authorization Middleware)
- task-006 (Audit Trail Service)

## Required Documents

- **AI Contract:** docs/04-ai-contract/07-module-contract.md, docs/04-ai-contract/04-api-contract.md, docs/04-ai-contract/06-database-contract.md, docs/04-ai-contract/09-security-contract.md, docs/04-ai-contract/05-auth-contract.md
- **PRD:** docs/01-prd/features/system.md, docs/01-prd/business-rules.md § 10
- **SAD:** docs/03-sad/21-module-system.md (Section 4.6 UC-SYS-005 Notification Template and Delivery, Section 7.4 Notification Delivery Rules)
- **Design:** No page-level spec exists yet (documented gap in docs/02-design/pages/overview.md) — follow CLAUDE.md frontend rules until a design spec exists.

## Required Existing Code

task-195, task-197, task-013, task-014, task-006.

## Backend Scope

- Application layer: `SendNotificationUseCase` (internal service API called by other modules, e.g. Reservation reminders, Warehouse expiry alerts, Finance closing reminders) — renders the requested template against the approved payload, creates a queued `Notification` row, and dispatches via a provider adapter.
- Infrastructure layer: retry policy for transient failures using the same idempotency key; permanent failures are dead-lettered and visible to authorised staff per UC-SYS-005 step 5.
- Publishes delivery-outcome events consumed by the Audit/Activity log.

## Frontend Scope

No dedicated page in this task; backend-only per Backend Scope. Any UI consuming this endpoint is scoped to a later frontend task once docs/02-design coverage exists.

## Database Impact

Inserts/updates system_notifications (status transitions: queued → sent/failed → dead-lettered).

## API Impact

None (internal service + background worker; no new synchronous public endpoint in this task).

## Workflow Impact

Completes UC-SYS-005 and is the mechanism by which Reservation, Warehouse (expiry), and Finance (closing) reminders are delivered — the 'Reminder Notification' automation item.

## Security Impact

Only approved payloads (validated against the template's variable schema) may be sent; unsafe content blocked per channel policy. Failed transient sends retry idempotently.

## Testing Required

- Unit tests for the Use Case/Entity (per docs/05-testing/unit-tests.md).
- Integration test for Controller/Repository (per docs/05-testing/api-tests.md).

## Deliverables

- `SendNotificationUseCase`, provider adapter interface, retry/dead-letter handling
- Delivery-outcome event publisher
- Unit + integration tests including a dead-letter scenario

## Acceptance Criteria

Per docs/01-prd/acceptance-criteria/system.md (sourced from docs/03-sad/21-module-system.md):

- Transient failure retries idempotently using the same idempotency key (no duplicate delivery).
- Permanent failure is dead-lettered and visible to authorised staff, not silently dropped.

## Definition of Done

Worker implemented and tested against both the retry and dead-letter paths. **Ambiguity flagged:** the specific reminder-triggering events from Reservation/Warehouse/Finance (e.g. 'reservation 24h before', 'batch nearing expiry', 'daily closing not yet submitted') are not enumerated as literal scheduled triggers in docs/03-sad/21-module-system.md; this task builds the generic delivery mechanism only. Wiring specific reminder triggers from each source module is out of scope for this task and must be a follow-up task once each module's trigger condition is confirmed.

---

## Dependency Detail

- **Blocked By:** task-195, task-197
- **Required Before:** See phase-3-plan.md Implementation Order.
- **Can Run In Parallel With:** Tasks in other Epics once own dependencies are satisfied.
