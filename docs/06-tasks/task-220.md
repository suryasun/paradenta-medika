# task-220: Branch Performance Report (GET /reports/branch-performance)

**Phase:** Phase 4 - Multi Branch Platform
**Epic:** BF. Branch Performance Monitoring
**Feature:** BF1. Performance Metrics
**Module:** Reporting
**Priority:** P1 - High

---

## Business Goal

Implement `GetBranchPerformanceReportUseCase` for `GET /reports/branch-performance`, delivering the roadmap 'Branch Performance Monitoring' capability, grounded in Queue's Manager Dashboard 'Branch Performance' field and Billing's Reporting & Analytics 'Branch Performance' report item.

## Depends On

- task-178 (Reporting Read-Model Projection Infrastructure)
- task-180 (Operations Dashboard)

## Required Documents

- **AI Contract:** docs/04-ai-contract/07-module-contract.md, docs/04-ai-contract/04-api-contract.md, docs/04-ai-contract/09-security-contract.md
- **PRD:** docs/01-prd/features/reporting.md, docs/01-prd/business-rules.md § 9
- **SAD:** docs/03-sad/20-module-report.md (Section 4.3 Operational Reports (pattern)), docs/03-sad/14-module-queue.md 'Manager Dashboard' Branch Performance field, and docs/03-sad/16-module-billing.md Section 'Reporting & Analytics' Branch Performance report item
- **Design:** No page-level spec exists yet (documented gap in docs/02-design/pages/overview.md) — follow CLAUDE.md frontend rules until a design spec exists.

## Required Existing Code

task-178, task-180, task-013, task-014.

## Backend Scope

- Presentation layer: route, controller for `GET /reports/branch-performance` (convention-derived).
- Application layer: `GetBranchPerformanceReportUseCase` — aggregates queue throughput/wait-time, doctor productivity, and billing collection rate per branch over a selected period, trended over time (distinct from task-218's point-in-time side-by-side comparison).

## Frontend Scope

No dedicated page in this task; backend-only per Backend Scope. Any UI consuming this endpoint is scoped to a later frontend task once docs/02-design coverage exists.

## Database Impact

Read-only; queries dashboard_summaries and report_snapshots for trend data.

## API Impact

Adds GET /reports/branch-performance.

## Workflow Impact

Supports ongoing branch-performance monitoring for Owner/Clinic Manager, distinct from the point-in-time Branch Comparison report.

## Security Impact

Gated the same way as task-218 (scope intersected, never widened).

## Testing Required

- Unit tests for the Use Case/Entity (per docs/05-testing/unit-tests.md).
- Integration test for Controller/Repository (per docs/05-testing/api-tests.md).

## Deliverables

- `GetBranchPerformanceReportUseCase`, route, controller, tests

## Acceptance Criteria

Per docs/01-prd/acceptance-criteria/reporting.md:

- Output is trended (multiple periods), distinguishing it from the point-in-time Branch Comparison report.
- Scope enforcement matches TC-RPT-008.

## Definition of Done

Endpoint implemented and tested. **Ambiguity flagged:** no literal endpoint/schema exists for this report in the Report module's Section 6 API tables; derived from Queue's and Billing's narrative report-catalog mentions of 'Branch Performance'.

---

## Dependency Detail

- **Blocked By:** task-178, task-180
- **Required Before:** See phase-4-plan.md Implementation Order.
- **Can Run In Parallel With:** Tasks in other Epics once own dependencies are satisfied.
