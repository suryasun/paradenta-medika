# task-221: Master Data Template (Entity & Migration)

**Phase:** Phase 4 - Multi Branch Platform
**Epic:** BG. Centralized Master Data
**Feature:** BG1. Template Definition
**Module:** Master Data
**Priority:** P1 - High

---

## Business Goal

Create the `MasterDataTemplate` entity/migration realizing docs/03-sad/11-module-master-data.md's Section 5.1 'Centralized Reference Data' business objective at the multi-branch level: a Head-Office-defined template (e.g. a standard Service, Room type, or clinical master item) that can be pushed to multiple branches — the roadmap 'Centralized Master Data' capability's foundation.

## Depends On

- task-021 (Clinic Entity)
- task-013 (Authentication Middleware)
- task-014 (Authorization Middleware)
- task-006 (Audit Trail Service)

## Required Documents

- **AI Contract:** docs/04-ai-contract/07-module-contract.md, docs/04-ai-contract/04-api-contract.md, docs/04-ai-contract/06-database-contract.md
- **PRD:** docs/01-prd/features/master-data.md, docs/01-prd/business-rules.md § 1
- **SAD:** docs/03-sad/11-module-master-data.md (Section 5.1 Centralized Reference Data, Section 5.2 Standardization, Section 8 Master Data Catalog)
- **Design:** No page-level spec exists yet (documented gap in docs/02-design/pages/overview.md) — follow CLAUDE.md frontend rules until a design spec exists.

## Required Existing Code

task-021, task-013, task-014, task-006.

## Backend Scope

- Domain layer: `MasterDataTemplate` entity (entityType e.g. service/room-type/item-category, templatePayload, version, ownerClinicId).
- Infrastructure layer: Prisma migration for `masterdata_templates`; `IMasterDataTemplateRepository` + Prisma implementation.

## Frontend Scope

No dedicated page in this task; backend-only per Backend Scope. Any UI consuming this endpoint is scoped to a later frontend task once docs/02-design coverage exists.

## Database Impact

Creates masterdata_templates table.

## API Impact

None in this task (endpoints in task-221).

## Workflow Impact

Foundational for the Push Master Data Template workflow (task-221).

## Security Impact

No direct endpoint; downstream gated by a masterdata-template-manage permission (Administrator/Owner scope per Section 9 User Roles & Permissions).

## Testing Required

- Unit tests for the Use Case/Entity (per docs/05-testing/unit-tests.md).
- Integration test for Controller/Repository (per docs/05-testing/api-tests.md).

## Deliverables

- `MasterDataTemplate` entity, migration, repository

## Acceptance Criteria

Per docs/01-prd/acceptance-criteria/master-data.md:

- Entity supports versioning so a template can evolve without breaking branches already synced to a prior version.

## Definition of Done

Entity and migration implemented and unit-tested.

---

## Dependency Detail

- **Blocked By:** task-021, task-013, task-014, task-006
- **Required Before:** See phase-4-plan.md Implementation Order.
- **Can Run In Parallel With:** Tasks in other Epics once own dependencies are satisfied.
