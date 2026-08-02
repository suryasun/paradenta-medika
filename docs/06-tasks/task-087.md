# task-087: Get Consent / Consent History

**Phase:** Phase 2 - Core Clinical Operations  
**Epic:** R. Consent Management  
**Feature:** R1. Digital Consent Form  
**Module:** EMR  
**Priority:** P1 - High

---

## Business Goal

Allow staff to retrieve a patient's consent history for legal/audit purposes or to check whether a required consent has already been signed before a procedure.

## Depends On

- task-086

## Required Documents

- **AI Contract:** docs/04-ai-contract/04-api-contract.md
- **PRD:** docs/01-prd/features/emr.md
- **SAD:** docs/03-sad/15-module-emr.md Section 38 (Audit Ready design principle)
- **Design:** No page-level spec exists yet (documented gap).

## Required Existing Code

task-086.

## Backend Scope

- GetConsentUseCase, ListPatientConsentsUseCase.
- Endpoint path convention-derived, e.g. GET /api/v1/emr/consents/{id}, GET /api/v1/patients/{patientId}/consents.

## Frontend Scope

- Consent History tab on Patient Detail (a related-but-distinct view from the generic tabs in docs/02-design/pages/patient.md Section 12.2 -- flagged as a design gap, same pattern as task-066's Prescription History).

## Database Impact

- Read-only query.

## API Impact

- Adds GET /api/v1/emr/consents/{id}, GET /api/v1/patients/{patientId}/consents.

## Workflow Impact

Supporting compliance/legal-review workflow.

## Security Impact

- Gated by emr.consent.read permission.

## Testing Required

- Unit test: history returns all consents for a patient, signed and unsigned, in chronological order.

## Deliverables

- Both Use Cases, controllers, routes, DTOs, tests, frontend history tab.

## Acceptance Criteria

- Consent detail and patient-level history are both retrievable and accurate.

## Definition of Done

- Implemented, tested, permission-gated.

---

## Dependency Detail

- **Blocked By:** task-086.
- **Required Before:** None blocking.
- **Can Run In Parallel With:** task-088, task-089, task-090.
