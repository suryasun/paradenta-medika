# task-222: Push Master Data Template to Branches (POST /masterdata/templates/{templateId}/push)

**Phase:** Phase 4 - Multi Branch Platform
**Epic:** BG. Centralized Master Data
**Feature:** BG2. Template Distribution
**Module:** Master Data
**Priority:** P1 - High

---

## Business Goal

Implement `PushMasterDataTemplateUseCase`, applying a Head-Office template to one or more selected branches — creating or updating the corresponding branch-scoped master data records (e.g. Service, Room type) — the core mechanic of the roadmap 'Centralized Master Data' capability.

## Depends On

- task-221 (Master Data Template)
- task-022 (Branch Entity)

## Required Documents

- **AI Contract:** docs/04-ai-contract/07-module-contract.md, docs/04-ai-contract/04-api-contract.md, docs/04-ai-contract/06-database-contract.md
- **PRD:** docs/01-prd/features/master-data.md, docs/01-prd/business-rules.md § 1
- **SAD:** docs/03-sad/11-module-master-data.md (Section 10.2 CRUD Workflow, Section 10.3 Cross Module Usage)
- **Design:** No page-level spec exists yet (documented gap in docs/02-design/pages/overview.md) — follow CLAUDE.md frontend rules until a design spec exists.

## Required Existing Code

task-221, task-022, task-013, task-014, task-006.

## Backend Scope

- Presentation layer: route, controller for `POST /masterdata/templates/{templateId}/push` (convention-derived path; no literal endpoint exists in the SAD's Master Data section, which does not enumerate a dedicated API specification section comparable to Warehouse/Finance's Section 6 — see Ambiguity).
- Application layer: `PushMasterDataTemplateUseCase` — for each target branchId, creates the branch-scoped record if absent or updates it if the branch hasn't diverged from the template's prior version (does not silently overwrite a branch's intentional local customization — see task-222).

## Frontend Scope

No dedicated page in this task; backend-only per Backend Scope. Any UI consuming this endpoint is scoped to a later frontend task once docs/02-design coverage exists.

## Database Impact

Writes/updates the branch-scoped master data tables the template's entityType maps to.

## API Impact

Adds POST /masterdata/templates/{templateId}/push.

## Workflow Impact

Realizes 'Centralized Master Data' — standardizing reference data across branches from a single source of truth.

## Security Impact

Gated by masterdata-template-manage permission. Audit Trail entry required listing every branch affected.

## Testing Required

- Unit tests for the Use Case/Entity (per docs/05-testing/unit-tests.md).
- Integration test for Controller/Repository (per docs/05-testing/api-tests.md).

## Deliverables

- `PushMasterDataTemplateUseCase`, route, controller, tests

## Acceptance Criteria

Per docs/01-prd/acceptance-criteria/master-data.md:

- A branch record that has been locally customized since the last push is flagged as a conflict rather than silently overwritten.
- Push to a branch without the record creates it; push to a branch with an un-diverged record updates it.

## Definition of Done

Endpoint implemented and tested against both the create and update paths and the conflict-detection case. **Ambiguity flagged (see phase-4-plan.md):** docs/03-sad/11-module-master-data.md (as reviewed) does not contain a Section 6-style literal API specification comparable to Warehouse/Finance; this task's endpoint path and payload shape are derived from the documented URL convention and the module's narrative CRUD/Cross-Module-Usage workflow sections, not from a literal spec.

---

## Dependency Detail

- **Blocked By:** task-221, task-022
- **Required Before:** See phase-4-plan.md Implementation Order.
- **Can Run In Parallel With:** Tasks in other Epics once own dependencies are satisfied.
