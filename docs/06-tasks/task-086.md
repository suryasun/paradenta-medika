# task-086: Create & Sign Consent

**Phase:** Phase 2 - Core Clinical Operations  
**Epic:** R. Consent Management  
**Feature:** R1. Digital Consent Form  
**Module:** EMR  
**Priority:** P0 - Blocking

---

## Business Goal

Allow the clinic to capture a patient's (or guardian's) legally-binding electronic signature on a consent form before a clinical procedure requiring consent proceeds, per the documented Design Principles: Legally Traceable, Immutable, Version Controlled, Digitally Signed, Audit Ready.

## Depends On

- task-085
- Phase 1 task-048

## Required Documents

- **AI Contract:** docs/04-ai-contract/09-security-contract.md
- **PRD:** docs/01-prd/features/emr.md
- **SAD:** docs/03-sad/15-module-emr.md Section 38 (Digital Consent Form Overview -- Design Principles), Section 41 (Consent Workflow, line 8289)
- **Design:** No page-level spec exists yet (documented gap) -- an e-signature capture UI (drawn signature or typed + confirmation) is required; exact UX is not specified in the SAD.

## Required Existing Code

task-085 (template), Phase 1 task-048 (Visit), task-078 (the signed consent document itself should be stored via the Attachment module per Section 4's Attachment Relationship, which lists 'Consent' as an Attachment category).

## Backend Scope

- CreateConsentUseCase: instantiate a consent from a template (task-085) for a specific patient/visit/procedure.
- SignConsentUseCase: capture the signature (patient or guardian), timestamp, and signer identity; render the signed document immutable per Section 38's Immutable/Version Controlled principles; store the resulting signed document via task-078's Upload Attachment flow with category 'Consent'.
- Endpoint path convention-derived, e.g. POST /api/v1/emr/consents, POST /api/v1/emr/consents/{id}/sign.

## Frontend Scope

- Consent presentation + e-signature capture screen (patient-facing or staff-assisted, per clinic workflow -- exact device/kiosk UX is not specified in the SAD).

## Database Impact

- New consents table (FK to consent_templates, patients, visits) plus the resulting Attachment row from task-078.

## API Impact

- Adds POST /api/v1/emr/consents, POST /api/v1/emr/consents/{id}/sign.

## Workflow Impact

Should gate procedures that legally require consent (Clinical/Surgical categories) -- exact enforcement point (blocking Treatment recording without a signed consent) is not explicitly specified in the summarized SAD sections and should be confirmed against the full Part 3.3D before making it a hard technical gate.

## Security Impact

- Gated by emr.consent.create/sign permissions.
- Signed consents must be immutable and audit-logged for legal defensibility.

## Testing Required

- Unit test: signing a consent produces an immutable record and a corresponding Attachment.
- Unit test: an already-signed consent cannot be re-signed or edited.

## Deliverables

- CreateConsentUseCase, SignConsentUseCase, controllers, routes, DTOs, tests, frontend signature capture UI.

## Acceptance Criteria

- Consent instance references the correct template, patient, and visit.
- Signed consent is immutable and stored as a Consent-category Attachment.
- Signature includes timestamp and signer identity.

## Definition of Done

- Implemented, tested, permission-gated, audit-logged.
- Hard-gate-vs-soft-reminder enforcement decision for procedures requiring consent explicitly confirmed against docs/03-sad/15-module-emr.md Part 3.3D before this task is marked done.

---

## Dependency Detail

- **Blocked By:** task-085, Phase 1 task-048, task-078.
- **Required Before:** task-087.
- **Can Run In Parallel With:** task-088, task-089, task-090.
