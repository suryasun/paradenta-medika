# task-028: Patient Detail (GET /patients/{id})

**Phase:** Phase 1 - Foundation (MVP)  
**Epic:** D. Patient Management  
**Feature:** D1. Patient Registration & Profile  
**Module:** Patient  
**Priority:** P1 - High

---

## Business Goal

Allow staff and clinicians to view a patient's full profile and history in one place.

## Depends On

- task-001
- task-013
- task-014

## Required Documents

- **AI Contract:** docs/04-ai-contract/04-api-contract.md
- **PRD:** docs/01-prd/features/patient.md
- **SAD:** docs/03-sad/12-module-patient.md Section 20.2 (GET /patients/{id}) and Section 12.2 (Patient Detail Tabs: Profile, Identity, Address, Emergency Contact, Reservation History, Visit History, Treatment History, Payment History, Attachments, Audit Trail)
- **Design:** docs/02-design/pages/patient.md Section 12.2

## Required Existing Code

task-001.

## Backend Scope

- GetPatientDetailUseCase.
- GET /patients/{id} controller.
- Phase 1 note: Reservation/Visit/Treatment/Payment History tabs should return empty collections gracefully until the respective modules (Epics E, G, H) are implemented -- do not error if related data doesn't exist yet.

## Frontend Scope

- Patient Detail page with tabs per docs/02-design/pages/patient.md Section 12.2.

## Database Impact

- Read-only query, potentially joining reservations/visits/invoices once those tables are populated by later epics.

## API Impact

- Adds GET /patients/{id}.

## Workflow Impact

Used throughout the Patient Journey whenever staff need full context on a patient.

## Security Impact

- Gated by patient.read permission.
- Sensitive medical/contact fields should only be visible to roles with EMR/Patient read access, not all staff (see docs/03-sad/12-module-patient.md Section 29 Security).

## Testing Required

- Unit test: detail returns correct patient with empty related-history collections when none exist.
- Integration test: 404 for non-existent patient id.

## Deliverables

- GetPatientDetailUseCase, controller, route, DTOs, tests, frontend Patient Detail page.

## Acceptance Criteria

- Existing patient id returns full profile.
- Non-existent id returns 404 with standard error envelope.

## Definition of Done

- Implemented, tested, permission-gated.

---

## Dependency Detail

- **Blocked By:** task-001, task-013, task-014.
- **Required Before:** None blocking.
- **Can Run In Parallel With:** task-027, task-029, task-030.
