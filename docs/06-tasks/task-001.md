# task-001: Patient Registration (CreatePatient Use Case)

**Phase:** Phase 1 - Foundation (MVP)  
**Epic:** D. Patient Management  
**Feature:** D1. Patient Registration & Profile  
**Module:** Patient  
**Priority:** P0 - Blocking

---

## Business Goal

Implement the `CreatePatientUseCase` for the Patient module, following the golden-reference structure defined in `docs/03-sad/03-clean-architecture.md` Section 41 (Patient Module — Golden Reference), so that a new patient can be registered into the system — the entry point of the entire Patient Journey.

## Depends On

- task-013 (Authentication Middleware)
- task-014 (Authorization Middleware)
- task-006 (Audit Trail Service)

## Required Documents

- **AI Contract:** docs/04-ai-contract/07-module-contract.md, docs/04-ai-contract/04-api-contract.md, docs/04-ai-contract/06-database-contract.md
- **PRD:** docs/01-prd/features/patient.md, docs/01-prd/business-rules.md § 2
- **SAD:** docs/03-sad/12-module-patient.md (full — Sections 1–29), docs/03-sad/03-clean-architecture.md Section 41 (Golden Reference)
- **Design:** No page-level spec exists yet (documented gap in docs/02-design/pages/overview.md) — Registration form should follow the frontend rules in CLAUDE.md until a design spec exists.

## Required Existing Code

task-003 (patients table), task-013, task-014, task-006. This is otherwise a first implementation within its module — no prior Patient code exists.

## Backend Scope

- Presentation layer: route, controller, request DTO, validator (per docs/03-sad/12-module-patient.md Section 20 — API Specification, and Section 21 — Request & Response DTO).
- Application layer: `CreatePatientUseCase` implementing the flow in docs/03-sad/03-clean-architecture.md Section 41.3.
- Domain layer: `Patient` entity with the business rules in docs/01-prd/business-rules.md § 2, sourced from docs/03-sad/12-module-patient.md Section 5.
- Infrastructure layer: `PatientRepository` implementing `IPatientRepository` via Prisma.
- Publish `PatientRegistered` domain event per docs/03-sad/02-system-architecture.md Section 24.1 (Event Catalog).

Out of scope: Patient update/delete/merge (task-029, task-030), Reservation, and any other module's use cases.

## Frontend Scope

- Patient Registration form (Register Patient page per docs/02-design/pages/patient.md Section 12.1) capturing identity, contact, and medical-alert fields, calling POST /patients.

## Database Impact

- Inserts into the patients table (task-003 schema).

## API Impact

- Adds POST /patients.

## Workflow Impact

First step of the Patient Journey (docs/03-sad/01-system-overview.md Section 21.1): Patient → Reservation → CheckIn → Queue → Doctor → EMR → Billing → Payment → Completed.

## Security Impact

- Gated by patient.create permission (task-014 enforcement).
- Audit Trail entry required for the Create action (task-006).
- Sensitive identity/contact fields must not be logged in plaintext.

## Testing Required

- Unit tests for the Use Case and Entity (per docs/05-testing/unit-tests.md).
- Integration test for the Controller/Repository (per docs/05-testing/api-tests.md).

## Deliverables

- `CreatePatientUseCase` (application/use-cases/create-patient/)
- `CreatePatientRequest` / `PatientResponse` DTOs
- `Patient` entity (domain/entities/)
- `IPatientRepository` interface + Prisma implementation
- Route + Controller wiring
- Unit + integration tests

## Acceptance Criteria

Per docs/03-sad/03-clean-architecture.md Section 41.3, the flow must be:

```
Validate Request → Check Duplicate Identity → Generate Medical Record Number
  → Create Entity → Save Repository → Publish PatientRegistered Event → Return PatientResponse
```

Additional binding criteria from docs/01-prd/business-rules.md § 2 (sourced from docs/03-sad/12-module-patient.md):

- Nomor Rekam Medis (Medical Record Number) must be unique.
- A duplicate-identity check must run before the entity is created.
- Every field required by `CreatePatientRequest` must be validated per docs/03-sad/12-module-patient.md Section 21.
- On success, response must conform to the API Contract response schema (docs/04-ai-contract/04-api-contract.md § Response Schema).
- On failure, response must conform to docs/03-sad/02-system-architecture.md Section 19.4 (Error Response format).
- An Audit Trail entry must be created for the Create action.

## Definition of Done

- Implemented, tested per Acceptance Criteria, and conforms to the response envelope.
- Audit Trail entry verified.
- **Note on Test Scenarios:** docs/03-sad/12-module-patient.md does not contain a dedicated Test Scenario section (see docs/01-prd/acceptance-criteria/patient.md). The acceptance criteria above are derived from the Use Case flow and Business Rules sections directly. If a QA-authored Test Scenario section is added to the SAD later, this task's acceptance criteria should be reconciled against it.

---

## Dependency Detail

- **Blocked By:** task-003, task-013, task-014, task-006.
- **Required Before:** task-027 through task-030 (Patient List/Detail/Update/Archive), task-002 (Reservation needs an existing Patient), effectively all downstream Patient Journey tasks.
- **Can Run In Parallel With:** task-007 through task-026 (different modules).
