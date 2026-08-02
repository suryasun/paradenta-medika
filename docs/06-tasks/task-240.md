# task-240: Business Intelligence KPI Layer

**Phase:** Phase 5 - Enterprise Platform
**Epic:** CF. Data Warehouse & Business Intelligence
**Feature:** CF2. BI KPIs
**Module:** Reporting
**Priority:** P2 - Medium

---

## Business Goal

Implement `GetBusinessIntelligenceKpiUseCase` exposing the literal KPI list from docs/03-sad/15-module-emr.md Section 12 Business Intelligence (Revenue, New Patient, Returning Patient, Average Waiting Time, Average Treatment Time), sourced from the Data Warehouse (task-258) rather than live OLTP projections, completing the roadmap 'Data Warehouse' capability's consumption layer.

## Depends On

- task-239 (Data Warehouse ETL Pipeline)

## Required Documents

- **AI Contract:** docs/04-ai-contract/07-module-contract.md, docs/04-ai-contract/04-api-contract.md, docs/04-ai-contract/09-security-contract.md
- **PRD:** docs/01-prd/features/reporting.md, docs/01-prd/business-rules.md § 9
- **SAD:** docs/03-sad/15-module-emr.md (Section 12 Business Intelligence (KPI: Revenue, New Patient, Returning Patient, Average Waiting Time, Average Treatment Time))
- **Design:** No page-level spec exists yet (documented gap in docs/02-design/pages/overview.md) — follow CLAUDE.md frontend rules until a design spec exists.

## Required Existing Code

task-239, task-013, task-014.

## Backend Scope

- Presentation layer: route, controller for `GET /reports/business-intelligence/kpis` (convention-derived).
- Application layer: `GetBusinessIntelligenceKpiUseCase`, computes exactly the five literal KPIs from Section 12 against the Fact/Dimension warehouse schema (task-258), with historical trending (the warehouse's whole purpose over the live projection is longer retention/trend analysis).

## Frontend Scope

No dedicated page in this task; backend-only per Backend Scope. Any UI consuming this endpoint is scoped to a later frontend task once docs/02-design coverage exists.

## Database Impact

Read-only; queries the Data Warehouse schema.

## API Impact

Adds GET /reports/business-intelligence/kpis.

## Workflow Impact

Consumption layer for the Data Warehouse; distinct from Phase 3's near-real-time Executive Dashboard (task-179), which reads live projections, not the warehouse.

## Security Impact

Gated by a BI-read permission; branch-scoped per the requester's assignment.

## Testing Required

- Unit tests for the Use Case/Entity (per docs/05-testing/unit-tests.md).
- Integration test for Controller/Repository (per docs/05-testing/api-tests.md).

## Deliverables

- `GetBusinessIntelligenceKpiUseCase`, route, controller, tests

## Acceptance Criteria

Per docs/01-prd/acceptance-criteria/reporting.md:

- All five literal KPIs are computed and match the Section 12 list exactly (no invented KPIs added).
- Trend data spans a longer historical window than Phase 3's live dashboards, demonstrating the warehouse's added value over the projection layer.

## Definition of Done

Endpoint implemented and tested against the literal five-KPI list.

---

## Dependency Detail

- **Blocked By:** task-239
- **Required Before:** See phase-5-plan.md Implementation Order.
- **Can Run In Parallel With:** Tasks in other Epics once own dependencies are satisfied.
