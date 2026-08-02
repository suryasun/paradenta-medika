# task-067: Tooth Condition Reference Data (CRUD)

**Phase:** Phase 2 - Core Clinical Operations  
**Epic:** O. Interactive Odontogram  
**Feature:** O1. Odontogram Foundation  
**Module:** Master Data / EMR  
**Priority:** P0 - Blocking

---

## Business Goal

Establish the Tooth Condition reference catalog (e.g. Healthy, Caries, Filled, Missing, Crown) that every Odontogram entry (task-068) must select from -- the prerequisite master data for the entire Odontogram feature.

## Depends On

- Phase 1 task-013, task-014, task-006

## Required Documents

- **AI Contract:** docs/04-ai-contract/07-module-contract.md
- **PRD:** docs/01-prd/features/master-data.md
- **SAD:** docs/03-sad/11-module-master-data.md Section 8.1 ('Tooth Condition | Referensi Kondisi Gigi'); docs/03-sad/15-module-emr.md Part 3.1C ('Tooth Condition Model & Odontogram Versioning', line 2123)
- **Design:** No page-level spec exists yet (documented gap).

## Required Existing Code

Phase 1 task-013, task-014, task-006.

## Backend Scope

- ToothCondition entity, CRUD Use Cases (list is primarily needed; create/update is an Administrator settings function).
- Endpoint path convention-derived, e.g. GET/POST /api/v1/tooth-conditions.

## Frontend Scope

- Tooth Condition reference list (settings page); consumed as a dropdown/legend by the Odontogram UI (task-069).

## Database Impact

- New tooth_conditions table.

## API Impact

- Adds GET/POST /api/v1/tooth-conditions (and PUT for updates).

## Workflow Impact

Prerequisite reference data for task-068 (Record Tooth Condition).

## Security Impact

- Gated by a masterdata.tooth-condition.manage-equivalent permission for write; read is broadly available to clinical roles.

## Testing Required

- Unit + integration tests for CRUD.

## Deliverables

- Entity, Use Cases, Repository, controller, routes, DTOs, tests.

## Acceptance Criteria

- Tooth Condition catalog can be listed, created, and updated by an authorized user.

## Definition of Done

- Implemented, tested, permission-gated, audit-logged.

---

## Dependency Detail

- **Blocked By:** Phase 1 task-013, task-014, task-006.
- **Required Before:** task-068.
- **Can Run In Parallel With:** task-061 through task-066.
