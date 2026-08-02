# task-059: Operations Dashboard (GET /reports/dashboards/operations, simplified)

**Phase:** Phase 1 - Foundation (MVP)  
**Epic:** I. Dashboard (Simple)  
**Feature:** I1. Operations Dashboard  
**Module:** Reporting & Dashboard (minimal slice)  
**Priority:** P2 - Medium

---

## Business Goal

Give the Clinic Manager/Owner a single at-a-glance operational view (today's reservations, current queue length, today's collected revenue) without building the full Reporting module, per the Phase 1 roadmap's 'Dashboard sederhana' (simple dashboard) scope.

## Depends On

- task-037 through task-047 (Queue)
- task-031 (Reservation List)
- task-057 (Payment)

## Required Documents

- **AI Contract:** docs/04-ai-contract/04-api-contract.md
- **PRD:** docs/01-prd/features/reporting.md
- **SAD:** docs/03-sad/20-module-report.md Section 6.1 (GET /reports/dashboards/operations, permission report.dashboard.operations.read)
- **Design:** No page-level spec exists yet (documented gap).

## Required Existing Code

task-037 (Queue), task-031 (Reservation), task-057 (Payment) -- this task only aggregates data those modules already persist; it does not introduce new source data.

## Backend Scope

- OperationsDashboardUseCase computing a SIMPLIFIED metric set appropriate to Phase 1's actual data: today's reservation count, current queue counts by status, today's total collected payment amount.
- GET /reports/dashboards/operations controller, returning the response shape documented in docs/03-sad/20-module-report.md Section 6.1 but with only the metrics Phase 1 data supports -- the full multi-branch/multi-dashboard Reporting module (job/export/snapshot infrastructure) is explicitly out of Phase 1 scope; do not build report jobs, exports, or the other five dashboards (executive/clinical/finance/warehouse/hr) in this task.

## Frontend Scope

- Simple Dashboard page (a handful of KPI cards) as the landing page for Owner/Clinic Manager roles.

## Database Impact

- Read-only aggregate queries across reservations, queues, payments -- no new tables.

## API Impact

- Adds GET /reports/dashboards/operations (simplified response).

## Workflow Impact

Read-only operational visibility; does not change any workflow state.

## Security Impact

- Gated by report.dashboard.operations.read.
- Must respect branch-scoped authorization if multiple branches exist (per docs/03-sad/20-module-report.md 'server intersects requested branchIds with authorised scope').

## Testing Required

- Unit test: metrics compute correctly against seeded Reservation/Queue/Payment data.

## Deliverables

- OperationsDashboardUseCase, controller, route, DTOs, tests, frontend Dashboard page.

## Acceptance Criteria

- Dashboard shows accurate, real-time counts for today's reservations, current queue state, and today's collected payments.
- No other dashboard/report endpoint from the full Reporting module (Section 6.2-6.4) is exposed in this task.

## Definition of Done

- Implemented, tested, permission-gated.
- Explicitly scoped to the three Phase-1-derivable metrics above -- any additional metric requires a documented source module first.

---

## Dependency Detail

- **Blocked By:** task-037 through task-047, task-031, task-057.
- **Required Before:** None blocking (this is typically the last Phase 1 task since it aggregates everything else).
- **Can Run In Parallel With:** None -- naturally the last task in the implementation order.
