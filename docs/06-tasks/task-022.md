# task-022: Branch Entity (CRUD)

**Phase:** Phase 1 - Foundation (MVP)  
**Epic:** C. Master Data Foundation  
**Feature:** C1. Clinic & Branch  
**Module:** Master Data  
**Priority:** P0 - Blocking

---

## Business Goal

Establish the Branch master record used to scope Doctors, Reservations, Queues, and transactions per physical location, supporting the multi-branch-ready requirement.

## Depends On

- task-021

## Required Documents

- **AI Contract:** docs/04-ai-contract/07-module-contract.md
- **PRD:** docs/01-prd/features/master-data.md, docs/01-prd/business-rules.md Section 1
- **SAD:** docs/03-sad/11-module-master-data.md Section 11.2 (Branch)
- **Design:** No page-level spec exists yet (documented gap).

## Required Existing Code

task-021 (Clinic must exist for a Branch to reference).

## Backend Scope

- Branch entity, CRUD Use Cases, foreign key to Clinic.
- GET/POST /api/v1/branches, GET/PUT /api/v1/branches/{id} (endpoint path derived from documented URL convention, same note as task-021).

## Frontend Scope

- Branch List/Detail/Edit pages, scoped under a Clinic.

## Database Impact

- Reads/writes branches table (FK to clinics).

## API Impact

- Adds GET/POST /api/v1/branches, GET/PUT /api/v1/branches/{id}.

## Workflow Impact

Every Reservation, Queue, Visit, and Invoice in later epics carries a branch scope; this task is a hard prerequisite for realistic multi-branch data.

## Security Impact

- Gated by a masterdata.branch.manage-equivalent permission.
- Branch-scoped authorization patterns referenced across modules (e.g. docs/03-sad/21-module-system.md 'server-derived branch scope') depend on Branch existing first.

## Testing Required

- Unit + integration tests for CRUD.

## Deliverables

- Entity, Use Cases, Repository, controller, routes, DTOs, tests.

## Acceptance Criteria

- Branch can be created under a Clinic, listed, retrieved, updated.
- A Branch cannot be created referencing a non-existent Clinic.

## Definition of Done

- Implemented, tested, permission-gated, audit-logged.

---

## Dependency Detail

- **Blocked By:** task-021.
- **Required Before:** task-023 (Doctor), and every module task that needs a branch_id foreign key (Reservation, Queue, Visit, Invoice).
- **Can Run In Parallel With:** None within this Epic (sequential); can run parallel to Epic A/B tasks.
