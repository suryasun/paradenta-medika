# task-237: Central Audit Projection

**Phase:** Phase 5 - Enterprise Platform
**Epic:** CE. Central Audit & Audit Analytics
**Feature:** CE1. Central Audit
**Module:** System
**Priority:** P1 - High

---

## Business Goal

Implement the `*.audit-recorded.v1` central audit projection/normalisation referenced in docs/03-sad/21-module-system.md Section 7 as an 'Optional' incoming event type, promoting it to a required Phase 5 capability: a single normalized, cross-module audit projection distinct from (and rolling up) each module's own audit_logs writes from task-006, realizing the roadmap 'Central Audit' item.

## Depends On

- task-192 (Audit Log Query, Phase 3)
- task-006 (Audit Trail Service)

## Required Documents

- **AI Contract:** docs/04-ai-contract/07-module-contract.md, docs/04-ai-contract/04-api-contract.md, docs/04-ai-contract/06-database-contract.md, docs/04-ai-contract/09-security-contract.md, docs/04-ai-contract/05-auth-contract.md
- **PRD:** docs/01-prd/features/system.md, docs/01-prd/business-rules.md § 10
- **SAD:** docs/03-sad/21-module-system.md (Section 7.2 Incoming Events (`*.audit-recorded.v1` — Optional central audit projection/normalisation), Section 8.3 Audit Integrity)
- **Design:** No page-level spec exists yet (documented gap in docs/02-design/pages/overview.md) — follow CLAUDE.md frontend rules until a design spec exists.

## Required Existing Code

task-192, task-006, task-013, task-014.

## Backend Scope

- Application layer: `CentralAuditProjectionConsumer`, subscribing to every module's audit-recorded event (each module's task-006 usage already emits an auditable action per its own Definition of Done) and normalizing it into one cross-module, append-only projection (actor, module, action, target, branch, outcome, correlation id, timestamp), distinct from — and never replacing — each module's own immutable audit_logs table (defence in depth: two independently-written copies).
- Idempotent per source audit event id.

## Frontend Scope

No dedicated page in this task; backend-only per Backend Scope. Any UI consuming this endpoint is scoped to a later frontend task once docs/02-design coverage exists.

## Database Impact

Creates a system_central_audit_projection table (append-only, immutable, same integrity guarantees as task-006's own audit_logs per Section 8.3).

## API Impact

Extends task-192's GET /system/audit-logs to optionally query the central projection across all modules in one call (no new endpoint; extension of an existing one).

## Workflow Impact

Realizes 'Central Audit' — a genuinely cross-module, single-query audit trail rather than requiring a Security Admin to query each module's own audit writes separately.

## Security Impact

Central projection is immutable (`SYS_AUDIT_IMMUTABLE` applies identically here). No UI/API permits update/delete.

## Testing Required

- Unit tests for the Use Case/Entity (per docs/05-testing/unit-tests.md).
- Integration test for Controller/Repository (per docs/05-testing/api-tests.md).

## Deliverables

- `CentralAuditProjectionConsumer`, migration, repository
- Extension to task-192's query use case
- Idempotent-redelivery test

## Acceptance Criteria

Per docs/01-prd/acceptance-criteria/system.md:

- Every module's audit-recorded event appears exactly once in the central projection, even under redelivery.
- The central projection's immutability is verified by the same `SYS_AUDIT_IMMUTABLE` test pattern used in task-192.

## Definition of Done

Consumer, migration, and query extension implemented and tested. **Ambiguity flagged:** Section 7.2 marks this event contract 'Optional' and does not enumerate its literal payload schema; this task derives a normalized schema from the fields every module's own audit write already carries (per task-006's shared implementation), not from a literal spec.

---

## Dependency Detail

- **Blocked By:** task-192, task-006
- **Required Before:** See phase-5-plan.md Implementation Order.
- **Can Run In Parallel With:** Tasks in other Epics once own dependencies are satisfied.
