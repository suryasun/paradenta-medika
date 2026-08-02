# task-088: Issue Medical Certificate

**Phase:** Phase 2 - Core Clinical Operations  
**Epic:** S. Medical Certificate  
**Feature:** S1. Medical Certificate  
**Module:** EMR  
**Priority:** P2 - Medium

---

## Business Goal

Allow the Doctor to issue an official medical certificate (Fit to Work, Sick Leave, Medical Statement, Dental Treatment Certificate) for a patient, an administrative-clinical document generation feature.

## Depends On

- Phase 1 task-048
- task-078 (certificate stored as an Attachment)

## Required Documents

- **AI Contract:** docs/04-ai-contract/07-module-contract.md
- **PRD:** docs/01-prd/features/emr.md
- **SAD:** docs/03-sad/15-module-emr.md Section 25 (Medical Certificate -- Certificate Types: Fit To Work, Sick Leave, Medical Statement, Dental Treatment Certificate; Business Rules: only Doctor can issue, auto-generated certificate number, stored as Attachment)
- **Design:** No page-level spec exists yet (documented gap).

## Required Existing Code

Phase 1 task-048, task-078.

## Backend Scope

- IssueMedicalCertificateUseCase: generate a certificate with an auto-generated, unique certificate number, for one of the four documented types, and store the resulting document via task-078's Upload Attachment flow.
- Endpoint path convention-derived, e.g. POST /api/v1/emr/visits/{visitId}/medical-certificates.

## Frontend Scope

- Medical Certificate issuance form (type selection, details) within the Visit/EMR screen.

## Database Impact

- New medical_certificates table (or a specialized Attachment subtype).

## API Impact

- Adds the Medical Certificate issuance endpoint.

## Workflow Impact

Administrative output of a completed clinical encounter.

## Security Impact

- Gated by emr.certificate.issue permission (Doctor role only, per the explicit business rule).
- Audit Trail entry required -- legal document.

## Testing Required

- Unit test: certificate number is unique and auto-generated.
- Unit test: only a Doctor-role user can issue a certificate.

## Deliverables

- IssueMedicalCertificateUseCase, controller, route, DTOs, tests, frontend form.

## Acceptance Criteria

- Certificate issued with a unique number and stored as a retrievable Attachment.
- Only Doctor role can issue.

## Definition of Done

- Implemented, tested, permission-gated, audit-logged.

---

## Dependency Detail

- **Blocked By:** Phase 1 task-048, task-078.
- **Required Before:** None blocking.
- **Can Run In Parallel With:** task-086, task-087, task-089, task-090.
