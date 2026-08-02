# task-282: Executive Intelligence Dashboard

**Phase:** Phase 6 - Healthcare Ecosystem
**Epic:** DO. Executive Intelligence
**Feature:** DO1. Executive Intelligence
**Module:** Reporting
**Priority:** P2 - Medium

---

## Business Goal

Extend Phase 5's Unified Executive Dashboard (task-241) with the EMR Business Intelligence KPIs not yet surfaced there (Patient Satisfaction, Procedure Frequency) and the Predictive Financial Dashboard (task-304), realizing the roadmap 'Executive Intelligence' innovation area and docs/03-sad/20-module-report.md's own Phase 4 roadmap enhancement 'executive planning models.'

## Depends On

- task-241 (Unified Executive Dashboard, Phase 5)
- task-277 (Predictive Financial Dashboard)

## Required Documents

- **AI Contract:** docs/04-ai-contract/07-module-contract.md, docs/04-ai-contract/04-api-contract.md, docs/04-ai-contract/09-security-contract.md
- **PRD:** docs/01-prd/features/reporting.md, docs/01-prd/business-rules.md § 9
- **SAD:** docs/03-sad/15-module-emr.md (Section 12 Business Intelligence (KPI: Revenue, New Patient, Returning Patient, Average Waiting Time, Average Treatment Time, Patient Satisfaction, Procedure Frequency — the last two not yet built in Phase 5's task-259/260)) and docs/03-sad/20-module-report.md Section 12.3 Roadmap (Phase 4 row: 'executive planning models')
- **Design:** No page-level spec exists yet (documented gap in docs/02-design/pages/overview.md) — follow CLAUDE.md frontend rules until a design spec exists.

## Required Existing Code

task-241, task-277.

## Backend Scope

- Application layer: extend task-241's `GetUnifiedExecutiveDashboardUseCase` with the two remaining literal EMR BI KPIs (Patient Satisfaction — requires a patient-satisfaction data source not yet built anywhere in Phase 1–5, flagged below; Procedure Frequency — computable from existing Treatment/Procedure data) and embed task-304's predictive financial view as a dashboard section.

## Frontend Scope

No dedicated page in this task; backend-only per Backend Scope. Any UI consuming this endpoint is scoped to a later frontend task once docs/02-design coverage exists.

## Database Impact

Reads the Data Warehouse (Phase 5 task-239) and, for Patient Satisfaction, a new source that does not yet exist (see Ambiguity below).

## API Impact

Extends GET /reports/dashboards/executive-unified (task-241; no new route).

## Workflow Impact

Becomes the single top-level view combining business KPIs, infrastructure health, SLA status (all from task-241), and now forward-looking/qualitative intelligence (this task) for Owner-level decision-making.

## Security Impact

Same Owner/Administrator-only access as task-241.

## Testing Required

- Unit tests for the Use Case/Entity (per docs/05-testing/unit-tests.md).
- Integration test for Controller/Repository (per docs/05-testing/api-tests.md).

## Deliverables

- Extension to `GetUnifiedExecutiveDashboardUseCase`, tests

## Acceptance Criteria

Per docs/01-prd/acceptance-criteria/reporting.md:

- Procedure Frequency is correctly computed and added to the dashboard.
- Patient Satisfaction is either sourced from a documented mechanism or explicitly reported as a missing data source (see Definition of Done) rather than fabricated.

## Definition of Done

Extension implemented and tested for Procedure Frequency. **Ambiguity flagged (see phase-6-plan.md): Patient Satisfaction has no data-collection mechanism anywhere in the SAD** (no survey module, no NPS/CSAT capture endpoint exists in Phase 1–5). Per CLAUDE.md's Missing Information rule, this task does not invent a patient-satisfaction survey feature; it reports this as missing documentation, and the KPI is either omitted from the dashboard or shown as 'data source pending' until a survey-capture capability is separately specified.

---

## Dependency Detail

- **Blocked By:** task-241
- **Required Before:** See phase-6-plan.md Implementation Order.
- **Can Run In Parallel With:** Tasks in other Epics once own dependencies are satisfied.
