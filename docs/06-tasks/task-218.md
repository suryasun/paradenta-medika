# task-218: Branch Dashboard (GET /reports/dashboards/branch)

**Phase:** Phase 4 - Multi Branch Platform
**Epic:** BD. Branch Dashboard
**Feature:** BD1. Single-Branch Operational Summary
**Module:** Reporting
**Priority:** P1 - High

---

## Business Goal

Implement `GetBranchDashboardUseCase` for `GET /reports/dashboards/branch`, a single-branch operational summary combining Queue's Manager Dashboard fields (Total Queue, Average Waiting, Doctor Performance) and Billing's daily summary, following the same pattern as Phase 3's six domain dashboards (task-179–184) but scoped to one branch at a time — the roadmap 'Branch Dashboard' capability.

## Depends On

- task-178 (Reporting Read-Model Projection Infrastructure)
- task-180 (Operations Dashboard)
- task-182 (Finance Dashboard)

## Required Documents

- **AI Contract:** docs/04-ai-contract/07-module-contract.md, docs/04-ai-contract/04-api-contract.md, docs/04-ai-contract/09-security-contract.md
- **PRD:** docs/01-prd/features/reporting.md, docs/01-prd/business-rules.md § 9
- **SAD:** docs/03-sad/20-module-report.md (Section 6.1 Dashboard (pattern), Section 4.3 Operational Reports) and docs/03-sad/14-module-queue.md Section 'Manager Dashboard' (Total Queue, Average Waiting, Doctor Performance, Branch Performance)
- **Design:** No page-level spec exists yet (documented gap in docs/02-design/pages/overview.md) — follow CLAUDE.md frontend rules until a design spec exists.

## Required Existing Code

task-178, task-180, task-182, task-013, task-014.

## Backend Scope

- Presentation layer: route, controller for `GET /reports/dashboards/branch` (path derived from the existing dashboard convention in Section 6.1; not itself a literal row in the endpoint table, since Phase 3's table only lists the six domain dashboards).
- Application layer: `GetBranchDashboardUseCase`, reads dashboard_summaries filtered to a single branchId, combining Queue and Billing projections.

## Frontend Scope

No dedicated page in this task; backend-only per Backend Scope. Any UI consuming this endpoint is scoped to a later frontend task once docs/02-design coverage exists.

## Database Impact

Read-only; queries dashboard_summaries.

## API Impact

Adds GET /reports/dashboards/branch.

## Workflow Impact

Gives a Clinic Manager a single-screen view of their branch's daily operations.

## Security Impact

Gated by an operations-dashboard-equivalent permission, strictly intersected to the requester's assigned branch(es) via task-215's guard.

## Testing Required

- Unit tests for the Use Case/Entity (per docs/05-testing/unit-tests.md).
- Integration test for Controller/Repository (per docs/05-testing/api-tests.md).

## Deliverables

- `GetBranchDashboardUseCase`, route, controller, tests

## Acceptance Criteria

Per docs/01-prd/acceptance-criteria/reporting.md:

- Response includes dataAsOf/freshness per the Section 6.1 example fragment.
- A Clinic Manager cannot request a branch outside their assignment (`RPT_SCOPE_FORBIDDEN`).

## Definition of Done

Endpoint implemented and tested. **Ambiguity flagged:** this specific dashboard endpoint is not a literal row in docs/03-sad/20-module-report.md Section 6.1's table; it is derived from the existing dashboard pattern plus Queue's narrative 'Manager Dashboard' field list.

---

## Dependency Detail

- **Blocked By:** task-178, task-180, task-182
- **Required Before:** See phase-4-plan.md Implementation Order.
- **Can Run In Parallel With:** Tasks in other Epics once own dependencies are satisfied.
