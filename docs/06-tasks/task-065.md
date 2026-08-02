# task-065: Create Prescription (with Allergy Validation)

**Phase:** Phase 2 - Core Clinical Operations  
**Epic:** N. Prescription Management  
**Feature:** N1. Prescription  
**Module:** EMR  
**Priority:** P0 - Blocking

---

## Business Goal

Allow the Doctor to prescribe medicine for a patient during a visit, with a mandatory allergy safety check before the prescription can be saved.

## Depends On

- task-062 (Allergy -- hard safety dependency)
- Phase 1 task-048

## Required Documents

- **AI Contract:** docs/04-ai-contract/09-security-contract.md
- **PRD:** docs/01-prd/features/emr.md, docs/01-prd/business-rules.md
- **SAD:** docs/03-sad/15-module-emr.md Section 24 (Prescription Management -- Information: Medicine, Dosage, Frequency, Duration, Instruction; Business Rules: Medicine from Master Medicine, 'Prescription harus divalidasi terhadap Allergy', printable, history stored permanently)
- **Design:** No page-level spec exists yet (documented gap).

## Required Existing Code

task-062 (AllergyCheckService), Phase 1 task-048 (Visit). Note: docs/03-sad/11-module-master-data.md Section 8.2 lists a 'Medicine' master data entity that has no corresponding CRUD task in Phase 1 or Phase 2 so far -- this is a scope gap: Medicine master data management belongs to the Warehouse module (docs/03-sad/18-module-warehouse.md), which is out of both Phase 1 and Phase 2 per the roadmap. This task assumes a minimal Medicine reference list exists or must be added as a prerequisite; flagged rather than assumed.

## Backend Scope

- CreatePrescriptionUseCase: for each prescribed medicine, call AllergyCheckService (task-062) BEFORE persisting; block (or require explicit override with a documented reason, per whichever exact rule docs/03-sad/15-module-emr.md specifies -- verify before implementing an override path since block-vs-override isn't explicit in the summarized rule) on a matching allergy.
- Persist dosage, frequency, duration, instruction per medicine line.
- Endpoint path not literally given in SAD; derive from convention, e.g. POST /api/v1/emr/visits/{visitId}/prescriptions -- flagged as convention-derived.

## Frontend Scope

- Prescription entry form (medicine search/select, dosage/frequency/duration/instruction) within the Visit/EMR screen, surfacing an inline allergy warning.

## Database Impact

- New prescriptions and prescription_items tables linked to Visit.

## API Impact

- Adds the Prescription creation endpoint scoped under Visit.

## Workflow Impact

Part of the Clinical Workflow (docs/03-sad/01-system-overview.md Section 22), occurring after Treatment/Diagnosis and before Close Visit.

## Security Impact

- Gated by emr.prescription.create permission (Doctor role).
- Allergy validation is a hard patient-safety gate, not optional.
- Audit Trail entry required.

## Testing Required

- Unit test: prescribing a medicine matching a recorded Drug Allergy is blocked (or requires override, per the confirmed rule).
- Unit test: prescription without allergy conflict succeeds and persists all line details.

## Deliverables

- CreatePrescriptionUseCase, controller, route, DTOs, tests, frontend form.

## Acceptance Criteria

- No prescription can be saved without passing the Allergy check.
- All documented fields (Medicine, Dosage, Frequency, Duration, Instruction) persist correctly.
- Prescription history is permanent (never hard-deleted).

## Definition of Done

- Implemented, tested, permission-gated, audit-logged.
- Medicine master-data scope gap explicitly resolved or deferred with sign-off before this task is marked done.

---

## Dependency Detail

- **Blocked By:** task-062, Phase 1 task-048.
- **Required Before:** task-066 (Prescription History/Print).
- **Can Run In Parallel With:** task-063, task-067 through task-070.
