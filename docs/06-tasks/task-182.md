# task-182: Finance Dashboard (GET /reports/dashboards/finance)

**Phase:** Phase 3 - Operational Excellence
**Epic:** AG. Advanced Reporting — Dashboards
**Feature:** AG2. Dashboards
**Module:** Reporting
**Priority:** P1 - High

---

## Business Goal

Implement `GetFinanceDashboardUseCase` exposing `GET /reports/dashboards/finance` per docs/03-sad/20-module-report.md Section 6.1 Dashboard and Section 4 Katalog Dashboard dan Laporan, delivering the roadmap 'Advanced Reporting' feature for this consumer group.

## Depends On

- task-178

## Required Documents

- **AI Contract:** docs/04-ai-contract/07-module-contract.md, docs/04-ai-contract/04-api-contract.md, docs/04-ai-contract/09-security-contract.md
- **PRD:** docs/01-prd/features/reporting.md, docs/01-prd/business-rules.md § 9
- **SAD:** docs/03-sad/20-module-report.md (Section 6.1 Dashboard, Section 4 Katalog Dashboard dan Laporan)
- **Design:** No page-level spec exists yet (documented gap in docs/02-design/pages/overview.md) — follow CLAUDE.md frontend rules until a design spec exists.

## Required Existing Code

task-178, task-013, task-014.

## Backend Scope

- Presentation layer: route, controller for `GET /reports/dashboards/finance`, gated by `report.dashboard.finance.read`.
- Application layer: `GetFinanceDashboardUseCase` — reads from dashboard_summaries, sourced from Finance posted-journal projections (Section 4.4 Financial Reports), returns scope/dataAsOf/freshness/definitionVersion/metrics per Section 6.1's example response fragment.

## Frontend Scope

No dedicated page in this task; backend-only per Backend Scope. Any UI consuming this endpoint is scoped to a later frontend task once docs/02-design coverage exists.

## Database Impact

Read-only; queries dashboard_summaries.

## API Impact

Adds GET /reports/dashboards/finance.

## Workflow Impact

Delivers the Executive/Operational dashboard capability described in the roadmap.

## Security Impact

Gated by `report.dashboard.finance.read`. Cross-branch access intersected with the requester's assigned branch scope (Section 8.2 Row, Column, and Detail Security); Owner dashboard access does not automatically grant restricted detail per Section 4.2 note.

## Testing Required

- Unit tests for the Use Case/Entity (per docs/05-testing/unit-tests.md).
- Integration test for Controller/Repository (per docs/05-testing/api-tests.md).

## Deliverables

- `GetFinanceDashboardUseCase`, route, controller, tests

## Acceptance Criteria

Per docs/01-prd/acceptance-criteria/reporting.md (sourced from docs/03-sad/20-module-report.md):

- Response includes dataAsOf and freshness (`fresh`/`stale`/`partial`) per TC-RPT-004.
- Cross-branch request scope is intersected/rejected per TC-RPT-008.

## Definition of Done

Endpoint implemented and tested.

---

## Dependency Detail

- **Blocked By:** task-178
- **Required Before:** See phase-3-plan.md Implementation Order.
- **Can Run In Parallel With:** Tasks in other Epics once own dependencies are satisfied.
