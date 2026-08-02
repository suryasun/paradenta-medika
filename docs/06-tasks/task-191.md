# task-191: Report Export Download (GET /reports/exports/{artifactId}/download)

**Phase:** Phase 3 - Operational Excellence
**Epic:** AH. Report Catalog & Scheduled Reports
**Feature:** AH2. Scheduled Reports (Async Jobs)
**Module:** Reporting
**Priority:** P2 - Medium

---

## Business Goal

Implement `DownloadReportExportUseCase` per docs/03-sad/20-module-report.md Section 6.2/10.3, with retention expiry and export sanitisation.

## Depends On

- task-187 (Create Report Job)

## Required Documents

- **AI Contract:** docs/04-ai-contract/07-module-contract.md, docs/04-ai-contract/04-api-contract.md, docs/04-ai-contract/09-security-contract.md
- **PRD:** docs/01-prd/features/reporting.md, docs/01-prd/business-rules.md § 9
- **SAD:** docs/03-sad/20-module-report.md (Section 6.2 Report Query and Jobs, Section 10.3 Export Formats, Section 8.3 Export Controls)
- **Design:** No page-level spec exists yet (documented gap in docs/02-design/pages/overview.md) — follow CLAUDE.md frontend rules until a design spec exists.

## Required Existing Code

task-187, task-013, task-014, task-006.

## Backend Scope

- Presentation layer: route, controller for `GET /reports/exports/{artifactId}/download` returning a short-lived authorised download.
- Application layer: `DownloadReportExportUseCase` — sanitises spreadsheet export content to prevent formula-injection (per TC-RPT-014); creates an Audit Trail entry recording actor/scope/artifact/outcome (TC-RPT-018).

## Frontend Scope

No dedicated page in this task; backend-only per Backend Scope. Any UI consuming this endpoint is scoped to a later frontend task once docs/02-design coverage exists.

## Database Impact

Read-only; checks report_jobs/export artifact retention state.

## API Impact

Adds GET /reports/exports/{artifactId}/download.

## Workflow Impact

Terminal step of the Scheduled Reports/export workflow.

## Security Impact

`RPT_EXPORT_EXPIRED` (410) returned once retention has elapsed, with no file access granted (TC-RPT-013). Export content sanitised against spreadsheet-injection (TC-RPT-014).

## Testing Required

- Unit tests for the Use Case/Entity (per docs/05-testing/unit-tests.md).
- Integration test for Controller/Repository (per docs/05-testing/api-tests.md).

## Deliverables

- `DownloadReportExportUseCase`, route, controller, tests

## Acceptance Criteria

Per docs/01-prd/acceptance-criteria/reporting.md (sourced from docs/03-sad/20-module-report.md):

- TC-RPT-013: expired artifact returns 410, no file access.
- TC-RPT-014: exported spreadsheet content contains no executable formulas.
- TC-RPT-018: download creates an audit record with actor/scope/artifact/outcome.

## Definition of Done

Endpoint implemented and tested against all three referenced test scenarios.

---

## Dependency Detail

- **Blocked By:** task-187
- **Required Before:** See phase-3-plan.md Implementation Order.
- **Can Run In Parallel With:** Tasks in other Epics once own dependencies are satisfied.
