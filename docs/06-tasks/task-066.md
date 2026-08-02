# task-066: Prescription History & Print

**Phase:** Phase 2 - Core Clinical Operations  
**Epic:** N. Prescription Management  
**Feature:** N1. Prescription  
**Module:** EMR  
**Priority:** P2 - Medium

---

## Business Goal

Allow staff/doctors to view a patient's prescription history and print a prescription for the patient to take to a pharmacy, per the documented business rule that prescriptions 'dapat dicetak' and history is retained permanently.

## Depends On

- task-065

## Required Documents

- **AI Contract:** docs/04-ai-contract/04-api-contract.md
- **PRD:** docs/01-prd/features/emr.md
- **SAD:** docs/03-sad/15-module-emr.md Section 24 (Business Rules: printable, permanent history)
- **Design:** No page-level spec exists yet (documented gap).

## Required Existing Code

task-065.

## Backend Scope

- GetPrescriptionHistoryUseCase (list all prescriptions for a patient across visits).
- A print-ready representation (PDF or print-formatted view) of a single prescription -- exact format/template is not specified in the SAD; a minimal, clearly-labeled printable layout should be used rather than inventing an elaborate design.
- Endpoint path convention-derived, e.g. GET /api/v1/patients/{patientId}/prescriptions, GET /api/v1/emr/prescriptions/{id}/print.

## Frontend Scope

- Prescription History tab on Patient Detail (docs/02-design/pages/patient.md Section 12.2 already lists a generic 'Treatment History' tab; Prescription History is a related but distinct view not yet in that design spec -- flagged as a design gap); Print action.

## Database Impact

- Read-only query against prescriptions/prescription_items.

## API Impact

- Adds the history and print endpoints.

## Workflow Impact

Supporting/read workflow, not part of the primary clinical path.

## Security Impact

- Gated by emr.prescription.read permission.

## Testing Required

- Unit test: history returns all prescriptions for a patient in chronological order.
- Integration test: print output includes all required fields (patient, doctor, medicine, dosage, frequency, duration, instruction).

## Deliverables

- GetPrescriptionHistoryUseCase, print generation, controller, routes, DTOs, tests, frontend history tab + print action.

## Acceptance Criteria

- History is complete and immutable.
- Printed prescription contains all documented fields and is legible/complete.

## Definition of Done

- Implemented, tested, permission-gated.

---

## Dependency Detail

- **Blocked By:** task-065.
- **Required Before:** None blocking.
- **Can Run In Parallel With:** task-063, task-064, task-067 through task-070.
