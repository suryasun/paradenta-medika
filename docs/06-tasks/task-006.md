# task-006: Audit Trail Service (Cross-Cutting)

**Phase:** Phase 1 - Foundation (MVP)  
**Epic:** J. Foundational Infrastructure  
**Feature:** J2. Audit Trail Infrastructure  
**Module:** Cross-Cutting / Audit  
**Priority:** P0 - Blocking

---

## Business Goal

Provide a single, reusable Audit Trail service that every Create/Update/Delete use case in every module can call, satisfying the binding cross-cutting rule that every write operation produces an audit record.

## Depends On

- task-003 (Database Migration)
- task-005 (App Scaffold)

## Required Documents

- **AI Contract:** docs/04-ai-contract/09-security-contract.md
- **PRD:** docs/01-prd/business-rules.md (Cross-Cutting Rules: "Every Create/Update/Delete operation on business data must produce an Audit Trail entry")
- **SAD:** docs/03-sad/02-system-architecture.md Section 20 (Audit Trail)
- **Design:** N/A

## Required Existing Code

task-003 schema (needs an audit_logs table), task-005 middleware (needs Correlation ID and authenticated user context).

## Backend Scope

- Create audit_logs table migration: id, entity, entity_id, action, old_value (JSON), new_value (JSON), user_id, timestamp, ip_address, correlation_id per docs/03-sad/02-system-architecture.md Section 20.4.
- Implement AuditService.record(entity, entityId, action, oldValue, newValue, context) as an Infrastructure-layer service, callable from any module's Use Case.
- Audit writes must not block or fail the primary business transaction if the audit write itself fails -- log the failure and continue, or use an async/retry mechanism (docs/03-sad/03-clean-architecture.md Section 37.5).

## Frontend Scope

- None for Phase 1 (an Audit Log viewer UI is not in Phase 1 scope; System module's audit read endpoints belong to a later phase per docs/03-sad/21-module-system.md).

## Database Impact

- New audit_logs table.

## API Impact

- None directly -- this is an internal service, not exposed as its own endpoint in Phase 1.

## Workflow Impact

Consumed by every Create/Update/Delete Use Case across all Phase 1 modules (Patient, Reservation, Queue, EMR, Billing, Master Data, User Administration).

## Security Impact

- Audit log entries are append-only -- no update/delete operation should be exposed against audit_logs.
- old_value/new_value must never include the plaintext password field.

## Testing Required

- Unit test: AuditService.record persists a correctly-shaped audit_logs row.
- Unit test: a simulated audit-write failure does not roll back the primary business transaction (per Section 37.5).

## Deliverables

- audit_logs migration.
- AuditService implementation with a documented interface Use Cases can depend on.

## Acceptance Criteria

- Calling AuditService.record from a Use Case produces one row in audit_logs with all required fields populated.
- Audit failures never cause a business transaction rollback.

## Definition of Done

- Service implemented and unit tested.
- Interface documented for other module tasks to call.

---

## Dependency Detail

- **Blocked By:** task-003, task-005.
- **Required Before:** Every Create/Update/Delete task in Epics A-I (e.g. task-007 Login, task-021 Clinic CRUD, task-001 Create Patient already implemented should be checked for compliance).
- **Can Run In Parallel With:** None -- should be completed before other write-path tasks begin, though implementation can overlap with task-004.
