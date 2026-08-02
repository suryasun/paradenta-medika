# task-277: Predictive Financial Dashboard

**Phase:** Phase 6 - Healthcare Ecosystem
**Epic:** DL. Predictive Analytics
**Feature:** DL3. Financial Forecasting
**Module:** Reporting
**Priority:** P2 - Medium

---

## Business Goal

Implement the literal 'Predictive Financial Dashboard' named in docs/03-sad/16-module-billing.md's Future Enhancement list (Financial Analytics: Revenue Forecast, Payment Trend, Refund Trend, Branch Performance), consuming Phase 5's Data Warehouse (task-239/240) for the historical basis of the forecast.

## Depends On

- task-239 (Data Warehouse ETL Pipeline, Phase 5)
- task-240 (Business Intelligence KPI Layer, Phase 5)

## Required Documents

- **AI Contract:** docs/04-ai-contract/07-module-contract.md, docs/04-ai-contract/04-api-contract.md, docs/04-ai-contract/09-security-contract.md
- **PRD:** docs/01-prd/features/reporting.md, docs/01-prd/business-rules.md § 9
- **SAD:** docs/03-sad/16-module-billing.md (Section 12 Future Enhancement, Financial Analytics (Revenue Forecast, Payment Trend, Refund Trend, Branch Performance)) and docs/03-sad/20-module-report.md Section 12.3 Roadmap (Phase 4 row: 'predictive analytics')
- **Design:** No page-level spec exists yet (documented gap in docs/02-design/pages/overview.md) — follow CLAUDE.md frontend rules until a design spec exists.

## Required Existing Code

task-239, task-240, task-013, task-014.

## Backend Scope

- Presentation layer: route, controller for `GET /reports/dashboards/predictive-financial` (convention-derived).
- Application layer: `GetPredictiveFinancialDashboardUseCase` — trends the literal four metrics (Revenue Forecast, Payment Trend, Refund Trend, Branch Performance) using the Data Warehouse's Fact Revenue table as the historical basis for a simple, documented forecasting method (e.g. moving-average or linear trend — no SAD document specifies a forecasting algorithm, so this task's Definition of Done requires the chosen method to be explicitly documented, not presented as SAD-derived).

## Frontend Scope

No dedicated page in this task; backend-only per Backend Scope. Any UI consuming this endpoint is scoped to a later frontend task once docs/02-design coverage exists.

## Database Impact

Read-only; queries the Data Warehouse.

## API Impact

Adds GET /reports/dashboards/predictive-financial.

## Workflow Impact

Extends Phase 5's Unified Executive Dashboard (task-241) with forward-looking financial visibility.

## Security Impact

Gated by a finance-analytics-read permission (Owner/Finance Manager scope).

## Testing Required

- Unit tests for the Use Case/Entity (per docs/05-testing/unit-tests.md).
- Integration test for Controller/Repository (per docs/05-testing/api-tests.md).

## Deliverables

- `GetPredictiveFinancialDashboardUseCase`, route, controller, tests
- Documented forecasting method choice

## Acceptance Criteria

Per docs/01-prd/acceptance-criteria/reporting.md:

- All four literal metrics (Revenue Forecast, Payment Trend, Refund Trend, Branch Performance) are present.
- The forecasting method is explicitly documented, not left unstated.

## Definition of Done

Endpoint implemented and tested; forecasting method documented.

---

## Dependency Detail

- **Blocked By:** task-239, task-240
- **Required Before:** See phase-6-plan.md Implementation Order.
- **Can Run In Parallel With:** Tasks in other Epics once own dependencies are satisfied.
