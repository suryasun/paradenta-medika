# task-238: Audit Analytics Dashboard

**Phase:** Phase 5 - Enterprise Platform
**Epic:** CE. Central Audit & Audit Analytics
**Feature:** CE2. Audit Analytics
**Module:** Reporting
**Priority:** P2 - Medium

---

## Business Goal

Implement `GetAuditAnalyticsDashboardUseCase` for `GET /reports/dashboards/audit-analytics`, delivering the roadmap 'Audit Analytics' item — trend and anomaly views over the Central Audit Projection (task-256), extending Phase 3's basic audit query (task-192) into an analytical dashboard.

## Depends On

- task-237 (Central Audit Projection)
- task-178 (Reporting Read-Model Projection Infrastructure, Phase 3)

## Required Documents

- **AI Contract:** docs/04-ai-contract/07-module-contract.md, docs/04-ai-contract/04-api-contract.md, docs/04-ai-contract/09-security-contract.md
- **PRD:** docs/01-prd/features/reporting.md, docs/01-prd/business-rules.md § 9
- **SAD:** docs/03-sad/20-module-report.md (Section 6.1 Dashboard (pattern)) and docs/03-sad/21-module-system.md Section 12.3 Roadmap (Phase 4 row: 'organisation-wide governance analytics')
- **Design:** No page-level spec exists yet (documented gap in docs/02-design/pages/overview.md) — follow CLAUDE.md frontend rules until a design spec exists.

## Required Existing Code

task-237, task-178, task-013, task-014.

## Backend Scope

- Presentation layer: route, controller for `GET /reports/dashboards/audit-analytics` (convention-derived, following the existing dashboard pattern).
- Application layer: `GetAuditAnalyticsDashboardUseCase` — trends audit volume by module/action/actor over time, and flags statistically anomalous spikes (e.g. an unusual number of failed-permission events from one actor) for Security Admin review.

## Frontend Scope

No dedicated page in this task; backend-only per Backend Scope. Any UI consuming this endpoint is scoped to a later frontend task once docs/02-design coverage exists.

## Database Impact

Read-only; queries the Central Audit Projection (task-256).

## API Impact

Adds GET /reports/dashboards/audit-analytics.

## Workflow Impact

Supports the 'organisation-wide governance analytics' Enterprise RBAC maturity item alongside Access Review Automation (task-233).

## Security Impact

Gated by an audit-analytics-read permission (Security Admin/Owner scope).

## Testing Required

- Unit tests for the Use Case/Entity (per docs/05-testing/unit-tests.md).
- Integration test for Controller/Repository (per docs/05-testing/api-tests.md).

## Deliverables

- `GetAuditAnalyticsDashboardUseCase`, route, controller, tests

## Acceptance Criteria

Per docs/01-prd/acceptance-criteria/reporting.md:

- Dashboard correctly trends volume over a selected period and flags at least one class of anomaly (e.g. failed-permission spike) as a proof of the analytics capability.

## Definition of Done

Endpoint implemented and tested. **Ambiguity flagged:** no literal anomaly-detection algorithm is specified anywhere in the SAD; this task implements a documented, simple statistical threshold (e.g. N standard deviations above a rolling average) rather than inventing an undocumented ML approach, and states this choice explicitly rather than presenting it as SAD-derived.

---

## Dependency Detail

- **Blocked By:** task-237, task-178
- **Required Before:** See phase-5-plan.md Implementation Order.
- **Can Run In Parallel With:** Tasks in other Epics once own dependencies are satisfied.
