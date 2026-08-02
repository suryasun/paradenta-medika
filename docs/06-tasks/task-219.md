# task-219: Branch Comparison Report (GET /reports/branch-comparison)

**Phase:** Phase 4 - Multi Branch Platform
**Epic:** BE. Cross Branch Reporting
**Feature:** BE1. Multi-Branch Comparison
**Module:** Reporting
**Priority:** P1 - High

---

## Business Goal

Implement `GetBranchComparisonReportUseCase` for `GET /reports/branch-comparison`, delivering the roadmap 'Cross Branch Reporting' capability, grounded in docs/03-sad/20-module-report.md Section 4.1's Actor Matrix note that Owner has 'branch comparison' as a primary dashboard/report and Queue's Annual Report 'Branch Comparison' line item.

## Depends On

- task-178 (Reporting Read-Model Projection Infrastructure)
- task-179 (Executive Dashboard)

## Required Documents

- **AI Contract:** docs/04-ai-contract/07-module-contract.md, docs/04-ai-contract/04-api-contract.md, docs/04-ai-contract/09-security-contract.md
- **PRD:** docs/01-prd/features/reporting.md, docs/01-prd/business-rules.md § 9
- **SAD:** docs/03-sad/20-module-report.md (Section 4.1 Actor Matrix (Owner: branch comparison, Cross-branch per permission), Section 11 TC-RPT-008 Cross-branch dashboard request) and docs/03-sad/14-module-queue.md 'Annual Report' Branch Comparison line item
- **Design:** No page-level spec exists yet (documented gap in docs/02-design/pages/overview.md) — follow CLAUDE.md frontend rules until a design spec exists.

## Required Existing Code

task-178, task-179, task-013, task-014.

## Backend Scope

- Presentation layer: route, controller for `GET /reports/branch-comparison` (convention-derived; grouped by branch instead of a single dashboard's metric set).
- Application layer: `GetBranchComparisonReportUseCase` — accepts multiple branchIds, intersects with the requester's authorised scope (never widens, per TC-RPT-008), and returns the same metric set per branch side-by-side for comparison.

## Frontend Scope

No dedicated page in this task; backend-only per Backend Scope. Any UI consuming this endpoint is scoped to a later frontend task once docs/02-design coverage exists.

## Database Impact

Read-only; queries dashboard_summaries grouped by branch.

## API Impact

Adds GET /reports/branch-comparison.

## Workflow Impact

Realizes the Owner-level 'branch comparison' capability referenced in the Actor Matrix but not previously built as its own endpoint in Phase 3.

## Security Impact

`RPT_SCOPE_FORBIDDEN` (403) when any requested branch is outside authority — per TC-RPT-008, scope is intersected/rejected, never silently widened.

## Testing Required

- Unit tests for the Use Case/Entity (per docs/05-testing/unit-tests.md).
- Integration test for Controller/Repository (per docs/05-testing/api-tests.md).

## Deliverables

- `GetBranchComparisonReportUseCase`, route, controller, tests

## Acceptance Criteria

Per docs/01-prd/acceptance-criteria/reporting.md:

- TC-RPT-008: cross-branch request scope is intersected or rejected according to user assignment.
- Output is comparable (same metric set, same period) across all requested branches.

## Definition of Done

Endpoint implemented and tested against TC-RPT-008. **Ambiguity flagged:** no literal endpoint path or response schema for 'branch comparison' exists in Section 6 of the Report module SAD; this task derives it from the Actor Matrix narrative and the existing dashboard/report conventions.

---

## Dependency Detail

- **Blocked By:** task-178, task-179
- **Required Before:** See phase-4-plan.md Implementation Order.
- **Can Run In Parallel With:** Tasks in other Epics once own dependencies are satisfied.
