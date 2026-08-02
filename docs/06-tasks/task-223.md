# task-223: Master Data Consistency Report (GET /masterdata/templates/{templateId}/drift)

**Phase:** Phase 4 - Multi Branch Platform
**Epic:** BG. Centralized Master Data
**Feature:** BG3. Consistency Monitoring
**Module:** Master Data
**Priority:** P2 - Medium

---

## Business Goal

Implement `GetMasterDataDriftReportUseCase`, identifying branches whose master data has diverged from a Head-Office template since the last push, so an Administrator can decide whether to re-push or accept the local customization — completing the governance loop of 'Centralized Master Data'.

## Depends On

- task-222 (Push Master Data Template to Branches)

## Required Documents

- **AI Contract:** docs/04-ai-contract/07-module-contract.md, docs/04-ai-contract/04-api-contract.md, docs/04-ai-contract/06-database-contract.md
- **PRD:** docs/01-prd/features/master-data.md, docs/01-prd/business-rules.md § 1
- **SAD:** docs/03-sad/11-module-master-data.md (Section 5.5 Data Integrity)
- **Design:** No page-level spec exists yet (documented gap in docs/02-design/pages/overview.md) — follow CLAUDE.md frontend rules until a design spec exists.

## Required Existing Code

task-222, task-013, task-014.

## Backend Scope

- Presentation layer: route, controller for `GET /masterdata/templates/{templateId}/drift` (convention-derived).
- Application layer: `GetMasterDataDriftReportUseCase`, compares each pushed branch's current record against the template's version at last push.

## Frontend Scope

No dedicated page in this task; backend-only per Backend Scope. Any UI consuming this endpoint is scoped to a later frontend task once docs/02-design coverage exists.

## Database Impact

Read-only.

## API Impact

Adds GET /masterdata/templates/{templateId}/drift.

## Workflow Impact

Closes the loop on task-221's conflict-detection by surfacing drift proactively rather than only at push time.

## Security Impact

Gated by masterdata-template-manage permission.

## Testing Required

- Unit tests for the Use Case/Entity (per docs/05-testing/unit-tests.md).
- Integration test for Controller/Repository (per docs/05-testing/api-tests.md).

## Deliverables

- `GetMasterDataDriftReportUseCase`, route, controller, tests

## Acceptance Criteria

Per docs/01-prd/acceptance-criteria/master-data.md:

- Report lists each branch's divergence field-by-field, not just a boolean flag.

## Definition of Done

Endpoint implemented and tested. **Ambiguity flagged:** convention-derived path, no literal SAD spec.

---

## Dependency Detail

- **Blocked By:** task-222
- **Required Before:** See phase-4-plan.md Implementation Order.
- **Can Run In Parallel With:** Tasks in other Epics once own dependencies are satisfied.
