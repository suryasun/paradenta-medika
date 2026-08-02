# task-256: HL7 FHIR Resource Mapping Foundation

**Phase:** Phase 6 - Healthcare Ecosystem
**Epic:** DA. National Health Integration
**Feature:** DA2. FHIR Resource Mapping
**Module:** Patient
**Priority:** P1 - High

---

## Business Goal

Build the internal domain-to-FHIR-resource mapping library (Patient→FHIR Patient, Visit→FHIR Encounter, Diagnosis→FHIR Condition), a self-contained, testable capability that does not require an external SATUSEHAT connection to deliver value (it can already validate data completeness/quality against the FHIR shape), providing the technical foundation task-255's ADR requires before any live submission is attempted.

## Depends On

- task-001 (Create Patient)
- task-255 (National Health Integration Design Spike)

## Required Documents

- **AI Contract:** docs/04-ai-contract/07-module-contract.md, docs/04-ai-contract/04-api-contract.md, docs/04-ai-contract/06-database-contract.md, docs/04-ai-contract/09-security-contract.md
- **PRD:** docs/01-prd/features/patient.md, docs/01-prd/business-rules.md § 2
- **SAD:** docs/03-sad/15-module-emr.md (Section 15 Security and Compliance (HL7 FHIR Ready)) and docs/03-sad/12-module-patient.md Section 30 Future Enhancements
- **Design:** No page-level spec exists yet (documented gap in docs/02-design/pages/overview.md) — follow CLAUDE.md frontend rules until a design spec exists.

## Required Existing Code

task-001, task-255, task-013, task-014.

## Backend Scope

- Domain layer: `FhirPatientMapper`, `FhirEncounterMapper`, `FhirConditionMapper` — pure mapping functions from Parakita's existing `Patient`, `Visit`, and `Diagnosis` domain entities to standard HL7 FHIR R4 resource JSON shapes (using the publicly published FHIR R4 specification as the mapping target, not an invented schema — FHIR itself is an external, versioned standard, distinct from SATUSEHAT's specific API contract which remains undefined per task-255).
- Application layer: `ValidateFhirReadinessUseCase`, checking whether a given Patient/Visit/Diagnosis has all fields FHIR requires (e.g. a valid NIK-equivalent identifier), surfacing gaps before any future submission attempt.

## Frontend Scope

No dedicated page in this task; backend-only per Backend Scope. Any UI consuming this endpoint is scoped to a later frontend task once docs/02-design coverage exists.

## Database Impact

None (pure mapping/validation logic; no new persisted state).

## API Impact

Adds GET /patients/{patientId}/fhir-readiness (convention-derived; a diagnostic endpoint, not a submission endpoint).

## Workflow Impact

Provides the reusable technical foundation task-255's ADR calls for; can be built and tested entirely offline against the public FHIR R4 spec, independent of SATUSEHAT's undefined API.

## Security Impact

No new external data flow yet (no live submission); FHIR-shaped output must still respect the same field-level access rules as the source EMR data.

## Testing Required

- Unit tests for the Use Case/Entity (per docs/05-testing/unit-tests.md).
- Integration test for Controller/Repository (per docs/05-testing/api-tests.md).

## Deliverables

- FHIR resource mapper functions for Patient/Encounter/Condition
- `ValidateFhirReadinessUseCase`, route, controller, tests

## Acceptance Criteria

Per docs/01-prd/acceptance-criteria/patient.md:

- Mapped output validates against the public FHIR R4 JSON schema for Patient, Encounter, and Condition resources.
- Readiness check correctly flags a patient record missing a FHIR-required field.

## Definition of Done

Mappers and readiness-check endpoint implemented and tested against the public FHIR R4 schema.

---

## Dependency Detail

- **Blocked By:** task-001, task-255
- **Required Before:** See phase-6-plan.md Implementation Order.
- **Can Run In Parallel With:** Tasks in other Epics once own dependencies are satisfied.
