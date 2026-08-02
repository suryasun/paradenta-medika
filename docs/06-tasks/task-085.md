# task-085: Consent Category Reference Data

**Phase:** Phase 2 - Core Clinical Operations  
**Epic:** R. Consent Management  
**Feature:** R1. Digital Consent Form  
**Module:** EMR  
**Priority:** P1 - High

---

## Business Goal

Establish the reference catalog of consent categories/templates (General, Clinical, Surgical, per docs/03-sad/15-module-emr.md Section 39) that a specific consent instance (task-086) is created from.

## Depends On

- Phase 1 task-013, task-014, task-006

## Required Documents

- **AI Contract:** docs/04-ai-contract/07-module-contract.md
- **PRD:** docs/01-prd/features/emr.md
- **SAD:** docs/03-sad/15-module-emr.md Section 39 (Consent Categories -- General/Clinical/Surgical, with examples: registration, exam, privacy policy, scaling, filling, extraction, root canal, crown, bridge, denture, implant, veneer, odontectomy, flap surgery)
- **Design:** No page-level spec exists yet (documented gap).

## Required Existing Code

Phase 1 task-013, task-014, task-006.

## Backend Scope

- ConsentTemplate entity (category, title, body text) CRUD, seeded with the categories/examples in Section 39.
- Endpoint path convention-derived, e.g. GET/POST /api/v1/consent-templates.

## Frontend Scope

- Consent template management (settings page, Administrator only).

## Database Impact

- New consent_templates table.

## API Impact

- Adds GET/POST /api/v1/consent-templates.

## Workflow Impact

Prerequisite for task-086 (Create & Sign Consent).

## Security Impact

- Gated by a masterdata/emr.consent-template.manage-equivalent permission for write.

## Testing Required

- Unit + integration tests for CRUD.

## Deliverables

- Entity, Use Cases, Repository, controller, routes, DTOs, tests.

## Acceptance Criteria

- Templates can be listed, created, updated per the documented categories.

## Definition of Done

- Implemented, tested, permission-gated, audit-logged.

---

## Dependency Detail

- **Blocked By:** Phase 1 task-013, task-014, task-006.
- **Required Before:** task-086.
- **Can Run In Parallel With:** task-067 through task-084.
