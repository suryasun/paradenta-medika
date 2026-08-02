# task-178: Reporting Read-Model Projection Infrastructure

**Phase:** Phase 3 - Operational Excellence
**Epic:** AG. Advanced Reporting — Dashboards
**Feature:** AG1. Projection Infrastructure
**Module:** Reporting
**Priority:** P0 - Blocking

---

## Business Goal

Build the Reporting module's read-model projection scaffold per docs/03-sad/20-module-report.md Section 2.4 Read Model Architecture and Section 7 Event Contract, so dashboards can consume events from Patient, Reservation, Queue, EMR, Billing, Finance, Warehouse, and HR without querying their databases directly (module boundary rule).

## Depends On

- task-013 (Authentication Middleware)
- task-014 (Authorization Middleware)

## Required Documents

- **AI Contract:** docs/04-ai-contract/07-module-contract.md, docs/04-ai-contract/04-api-contract.md, docs/04-ai-contract/09-security-contract.md
- **PRD:** docs/01-prd/features/reporting.md, docs/01-prd/business-rules.md § 9
- **SAD:** docs/03-sad/20-module-report.md (Section 2 Arsitektur dan Sumber Data, Section 5 Data Model dan Lifecycle Report, Section 7 Integrasi dan Event Processing)
- **Design:** No page-level spec exists yet (documented gap in docs/02-design/pages/overview.md) — follow CLAUDE.md frontend rules until a design spec exists.

## Required Existing Code

task-013, task-014.

## Backend Scope

- Infrastructure layer: event consumer registry subscribing to the Source Events listed in Section 7.2; idempotent per-event watermark tracking (Section 2.5 Consistency Model) to prevent double counting on redelivery.
- Infrastructure layer: Prisma migrations for `report_jobs`, `report_snapshots`, `dashboard_summaries`, and projection checkpoint tables (Section 5.1–5.4).
- Domain layer: metric definition/version registry per Section 3.3 Metric Definition Standard.

## Frontend Scope

No dedicated page in this task; backend-only per Backend Scope. Any UI consuming this endpoint is scoped to a later frontend task once docs/02-design coverage exists.

## Database Impact

Creates report_jobs, report_snapshots, dashboard_summaries, and projection-checkpoint tables (Reporting's own read-only-facing schema; it never writes to source-module tables).

## API Impact

None in this task (endpoints in task-179 onward).

## Workflow Impact

Foundational for every dashboard/report endpoint in Epics AG and AH; realizes the roadmap 'Advanced Reporting' feature's architecture.

## Security Impact

Consumers run as trusted system workers; row/column/detail security (Section 8.2) is enforced at query time by downstream endpoint tasks, not by the projection layer itself.

## Testing Required

- Unit tests for the Use Case/Entity (per docs/05-testing/unit-tests.md).
- Integration test for Controller/Repository (per docs/05-testing/api-tests.md).

## Deliverables

- Event consumer registry + watermark tracking
- Migrations for report_jobs/report_snapshots/dashboard_summaries/checkpoints
- Metric definition/version registry
- Unit tests proving no double-count on duplicate/out-of-order event delivery (per TC-RPT-001/002/003)

## Acceptance Criteria

Per docs/01-prd/acceptance-criteria/reporting.md (sourced from docs/03-sad/20-module-report.md):

Per docs/01-prd/acceptance-criteria/reporting.md (sourced from docs/03-sad/20-module-report.md Section 11):

- TC-RPT-001/002/003: first consume, duplicate consume, and out-of-order consume all leave the read model consistent with no double counting.
- Every metric/report carries definitionVersion, scope, filter, and dataAsOf metadata per Section 6.1's example response fragment.

## Definition of Done

Projection infrastructure implemented and tested against TC-RPT-001/002/003. **Ambiguity flagged (see phase-3-plan.md):** the literal event names/schemas for each source module (Section 7.2 Source Events) reference the modules' own Event Catalogs, which are not fully enumerated with field-level schemas in the sections reviewed for Phase 1–3; each dashboard/report task in this Epic should confirm its specific source event's literal name against the owning module before going live.

---

## Dependency Detail

- **Blocked By:** task-013, task-014
- **Required Before:** See phase-3-plan.md Implementation Order.
- **Can Run In Parallel With:** Tasks in other Epics once own dependencies are satisfied.
