# task-248: Distributed Tracing

**Phase:** Phase 5 - Enterprise Platform
**Epic:** CJ. Observability
**Feature:** CJ3. Tracing
**Module:** Infrastructure
**Priority:** P1 - High

---

## Business Goal

Implement distributed tracing per docs/03-sad/24-deployment.md Part 9 Section 4, propagating a Trace ID/Span ID through every request per the literal Trace Flow (Client → Frontend → Backend API → Database → Response), enabling root-cause and latency analysis across the multi-instance application tier (task-243).

## Depends On

- task-243 (Application-Tier High Availability)
- task-246 (Centralized Logging Architecture)

## Required Documents

- **AI Contract:** docs/04-ai-contract/01-global-rules.md, docs/04-ai-contract/02-architecture-contract.md, docs/04-ai-contract/09-security-contract.md
- **PRD:** docs/01-prd/vision.md, docs/01-prd/product-goals.md
- **SAD:** docs/03-sad/24-deployment.md (Part 9 Section 4 Distributed Tracing (Trace Flow: Client → Frontend → Backend API → Database → Response; Trace Information: Trace ID, Span ID, Parent Span, Request Duration, Service Name, Error Status; Trace Benefits: Root Cause Analysis, Latency Analysis, Dependency Visualization, Service Performance Analysis))
- **Design:** No page-level spec exists yet (documented gap in docs/02-design/pages/overview.md) — follow CLAUDE.md frontend rules until a design spec exists.

## Required Existing Code

task-243, task-246.

## Backend Scope

- Application layer: trace context propagation (Trace ID, Span ID, Parent Span) through every layer named in the literal Trace Flow, attached to Correlation IDs already used by the Audit Trail (task-006) and every event consumer built in Phase 1–4, so a single request can be followed end-to-end across module boundaries.
- The same Trace ID is included in structured log lines (task-246) to let a Trace ID search in Loki pull every related log line.

## Frontend Scope

No dedicated page in this task; backend-only per Backend Scope. Any UI consuming this endpoint is scoped to a later frontend task once docs/02-design coverage exists.

## Database Impact

None.

## API Impact

None (cross-cutting instrumentation, not a new endpoint).

## Workflow Impact

Directly supports incident response (task-254) and the Alerting Strategy's Root Cause Analysis needs.

## Security Impact

Trace metadata must not include request/response bodies containing sensitive fields.

## Testing Required

- Infrastructure validation: config dry-run, smoke test against a non-production environment, and a documented operational drill (failover/restore/alert-fire test as applicable) per docs/03-sad/24-deployment.md.

## Deliverables

- Trace context propagation across Frontend/Backend/Database
- Trace ID correlated with existing Audit Trail correlation ids and structured logs

## Acceptance Criteria

Per docs/03-sad/24-deployment.md Part 9 (no dedicated PRD acceptance-criteria file exists for infrastructure):

- A single end-user request can be traced end-to-end from Frontend through Backend API to Database using one Trace ID.
- The same Trace ID appears in the corresponding structured log lines.

## Definition of Done

Tracing implemented and verified end-to-end for at least one representative cross-module request (e.g. Create Reservation).

---

## Dependency Detail

- **Blocked By:** task-243, task-246
- **Required Before:** See phase-5-plan.md Implementation Order.
- **Can Run In Parallel With:** Tasks in other Epics once own dependencies are satisfied.
