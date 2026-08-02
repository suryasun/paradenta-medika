# task-192: Audit Log Query (GET /system/audit-logs)

**Phase:** Phase 3 - Operational Excellence
**Epic:** AI. Audit Dashboard
**Feature:** AI1. Audit and Activity Inspection
**Module:** System
**Priority:** P1 - High

---

## Business Goal

Implement `QueryAuditLogsUseCase` per docs/03-sad/21-module-system.md UC-SYS-006 Inspect Audit and Activity, delivering the roadmap 'Audit Dashboard' feature.

## Depends On

- task-013 (Authentication Middleware)
- task-014 (Authorization Middleware)
- task-006 (Audit Trail Service)

## Required Documents

- **AI Contract:** docs/04-ai-contract/07-module-contract.md, docs/04-ai-contract/04-api-contract.md, docs/04-ai-contract/06-database-contract.md, docs/04-ai-contract/09-security-contract.md, docs/04-ai-contract/05-auth-contract.md
- **PRD:** docs/01-prd/features/system.md, docs/01-prd/business-rules.md § 10
- **SAD:** docs/03-sad/21-module-system.md (Section 4.7 UC-SYS-006 Inspect Audit and Activity, Section 6.3 API, Section 8.3 Audit Integrity)
- **Design:** No page-level spec exists yet (documented gap in docs/02-design/pages/overview.md) — follow CLAUDE.md frontend rules until a design spec exists.

## Required Existing Code

task-013, task-014, task-006.

## Backend Scope

- Presentation layer: route, controller, query DTO/validator for `GET /system/audit-logs` (filter by date, module, branch, actor, target, action, correlation id, outcome).
- Application layer: `QueryAuditLogsUseCase`, read-only against the Audit Trail store written by task-006 across every module.
- Restricted values are redacted per UC-SYS-006; the query/export itself produces an audit event.

## Frontend Scope

No dedicated page in this task; backend-only per Backend Scope. Any UI consuming this endpoint is scoped to a later frontend task once docs/02-design coverage exists.

## Database Impact

Read-only; queries the audit_logs table (written by task-006).

## API Impact

Adds GET /system/audit-logs.

## Workflow Impact

Realizes UC-SYS-006 Inspect Audit and Activity.

## Security Impact

Gated by `system.audit.read`-equivalent permission. No UI/API permits update/delete of the audit log (`SYS_AUDIT_IMMUTABLE`, 403). Restricted field values redacted per requester's authority.

## Testing Required

- Unit tests for the Use Case/Entity (per docs/05-testing/unit-tests.md).
- Integration test for Controller/Repository (per docs/05-testing/api-tests.md).

## Deliverables

- `QueryAuditLogsUseCase`, route, controller, tests

## Acceptance Criteria

Per docs/01-prd/acceptance-criteria/system.md (sourced from docs/03-sad/21-module-system.md):

- Attempting to modify/delete an audit entry via any endpoint returns `SYS_AUDIT_IMMUTABLE`.
- The query itself is recorded as an audit event.

## Definition of Done

Endpoint implemented and tested; immutability verified.

---

## Dependency Detail

- **Blocked By:** task-013, task-014, task-006
- **Required Before:** See phase-3-plan.md Implementation Order.
- **Can Run In Parallel With:** Tasks in other Epics once own dependencies are satisfied.
