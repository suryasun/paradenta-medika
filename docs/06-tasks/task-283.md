# task-283: Healthcare Data Exchange Gateway

**Phase:** Phase 6 - Healthcare Ecosystem
**Epic:** DP. Healthcare Data Exchange
**Feature:** DP1. Bidirectional Exchange
**Module:** Patient
**Priority:** P2 - Medium

---

## Business Goal

Generalize task-256's HL7 FHIR resource-mapping foundation into a bidirectional Healthcare Data Exchange capability (export a patient's record to another provider system, import an external referral/record), realizing the roadmap 'Healthcare Data Exchange' innovation area as an extension of — not a duplicate of — the National Health Integration epic (DA).

## Depends On

- task-256 (HL7 FHIR Resource Mapping Foundation)
- task-255 (National Health Integration Design Spike)

## Required Documents

- **AI Contract:** docs/04-ai-contract/07-module-contract.md, docs/04-ai-contract/04-api-contract.md, docs/04-ai-contract/06-database-contract.md, docs/04-ai-contract/09-security-contract.md
- **PRD:** docs/01-prd/features/patient.md, docs/01-prd/business-rules.md § 2
- **SAD:** docs/03-sad/15-module-emr.md (Section 15 Security and Compliance (HL7 FHIR Ready), same grounding as task-256 — no additional Healthcare Data Exchange-specific SAD content exists beyond what task-255/256 already established)
- **Design:** No page-level spec exists yet (documented gap in docs/02-design/pages/overview.md) — follow CLAUDE.md frontend rules until a design spec exists.

## Required Existing Code

task-256 (HL7 FHIR Resource Mapping Foundation), task-255.

## Backend Scope

- Application layer: `ExportPatientFhirBundleUseCase` (produces a FHIR Bundle for a patient using task-256's mappers, for the patient's own portability request or an authorized inter-provider transfer) and `ImportExternalFhirRecordUseCase` (accepts an external FHIR Bundle — e.g. a referral letter's structured data — and maps it into a reviewable staging record, never auto-merged into the patient's live EMR without doctor confirmation).

## Frontend Scope

No dedicated page in this task; backend-only per Backend Scope. Any UI consuming this endpoint is scoped to a later frontend task once docs/02-design coverage exists.

## Database Impact

Adds a staging table for imported-but-unreviewed external records.

## API Impact

Adds GET /patients/{patientId}/fhir-export, POST /patients/{patientId}/fhir-import (convention-derived).

## Workflow Impact

Distinct from task-255/256's SATUSEHAT-specific national-registry focus: this task is the general-purpose provider-to-provider exchange capability, usable even before (or without) a live SATUSEHAT connection.

## Security Impact

Export requires explicit patient consent or authorized clinical justification (referral). Import never auto-merges into the live EMR — a doctor must explicitly review and accept staged imported data, mirroring the AI Clinical Assistant's mandatory-review pattern (task-299).

## Testing Required

- Unit tests for the Use Case/Entity (per docs/05-testing/unit-tests.md).
- Integration test for Controller/Repository (per docs/05-testing/api-tests.md).

## Deliverables

- `ExportPatientFhirBundleUseCase`, `ImportExternalFhirRecordUseCase`, routes, controllers, tests

## Acceptance Criteria

Per docs/01-prd/acceptance-criteria/patient.md:

- Export produces a valid FHIR Bundle reusing task-256's validated mappers.
- Import never modifies the live EMR record without an explicit doctor-review step.

## Definition of Done

Both use cases implemented and tested against the mandatory-review-before-merge rule. **Ambiguity flagged:** this task's overlap with task-255/256 (Epic DA) must be reconciled at implementation time — DA is SATUSEHAT-specific and design-blocked, while DP is the general-purpose exchange mechanism and can proceed once task-256's mappers exist, independent of task-255's ADR approval.

---

## Dependency Detail

- **Blocked By:** task-256 (HL7 FHIR Resource Mapping Foundation), task-255
- **Required Before:** See phase-6-plan.md Implementation Order.
- **Can Run In Parallel With:** Tasks in other Epics once own dependencies are satisfied.
