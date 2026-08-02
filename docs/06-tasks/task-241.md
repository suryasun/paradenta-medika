# task-241: Unified Executive Dashboard

**Phase:** Phase 5 - Enterprise Platform
**Epic:** CG. Executive Dashboard
**Feature:** CG1. Unified View
**Module:** Reporting
**Priority:** P2 - Medium

---

## Business Goal

Implement `GetUnifiedExecutiveDashboardUseCase` for `GET /reports/dashboards/executive-unified`, realizing docs/03-sad/24-deployment.md's literal Dashboard Hierarchy (Executive Dashboard → Operations Dashboard → Application Dashboard → Infrastructure Dashboard) by rolling up Phase 3's business-KPI Executive Dashboard (task-179) with infrastructure health (task-247's Metrics) and SLA status (task-251) into one top-level view — the roadmap 'Executive Dashboard' item.

## Depends On

- task-179 (Executive Dashboard, Phase 3)
- task-247 (Metrics Collection)
- task-251 (SLA/SLO/SLI Monitoring)

## Required Documents

- **AI Contract:** docs/04-ai-contract/07-module-contract.md, docs/04-ai-contract/04-api-contract.md, docs/04-ai-contract/09-security-contract.md
- **PRD:** docs/01-prd/features/reporting.md, docs/01-prd/business-rules.md § 9
- **SAD:** docs/03-sad/24-deployment.md (Part 9 Section 7 Dashboard & Visualization (Dashboard Hierarchy: Executive Dashboard → Operations Dashboard → Application Dashboard → Infrastructure Dashboard))
- **Design:** No page-level spec exists yet (documented gap in docs/02-design/pages/overview.md) — follow CLAUDE.md frontend rules until a design spec exists.

## Required Existing Code

task-179, task-247, task-251, task-013, task-014.

## Backend Scope

- Presentation layer: route, controller for `GET /reports/dashboards/executive-unified` (convention-derived).
- Application layer: `GetUnifiedExecutiveDashboardUseCase`, combining task-179's business KPIs with a rolled-up infrastructure health summary (task-247) and current SLA compliance status (task-251) into the single top-of-hierarchy view the Deployment SAD describes.

## Frontend Scope

No dedicated page in this task; backend-only per Backend Scope. Any UI consuming this endpoint is scoped to a later frontend task once docs/02-design coverage exists.

## Database Impact

Read-only; queries dashboard_summaries (Reporting) and the metrics/SLA stores (Infrastructure/Observability).

## API Impact

Adds GET /reports/dashboards/executive-unified.

## Workflow Impact

Realizes the literal Dashboard Hierarchy concept from docs/03-sad/24-deployment.md, previously only implemented as its business-KPI layer (task-179) in Phase 3.

## Security Impact

Gated to Owner/Administrator (infrastructure health and SLA data are more sensitive/technical than the business-only KPI set task-179 already exposes to a wider Actor Matrix).

## Testing Required

- Unit tests for the Use Case/Entity (per docs/05-testing/unit-tests.md).
- Integration test for Controller/Repository (per docs/05-testing/api-tests.md).

## Deliverables

- `GetUnifiedExecutiveDashboardUseCase`, route, controller, tests

## Acceptance Criteria

Per docs/01-prd/acceptance-criteria/reporting.md:

- Response combines business KPIs, infrastructure health, and SLA status in one payload.
- Access is restricted to Owner/Administrator, not the wider set of roles task-179 already permits.

## Definition of Done

Endpoint implemented and tested. **Ambiguity flagged:** this specific unified-rollup endpoint is not itself a literal API row anywhere in the SAD; it operationalizes the narrative Dashboard Hierarchy diagram in docs/03-sad/24-deployment.md Part 9 Section 7, and its overlap with Phase 3's task-179 (same name, narrower business-only scope) must be reconciled at implementation time — this task extends rather than duplicates task-179.

---

## Dependency Detail

- **Blocked By:** task-179, task-247, task-251
- **Required Before:** See phase-5-plan.md Implementation Order.
- **Can Run In Parallel With:** Tasks in other Epics once own dependencies are satisfied.
