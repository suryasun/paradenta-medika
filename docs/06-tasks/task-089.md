# task-089: Create Referral (incl. Laboratory / Radiology Referral)

**Phase:** Phase 2 - Core Clinical Operations  
**Epic:** T. Referral & Follow Up  
**Feature:** T1. Referral  
**Module:** EMR  
**Priority:** P1 - High

---

## Business Goal

Allow the Doctor to refer a patient to a Specialist, Hospital, Laboratory, or Radiology provider -- this task fulfills the roadmap's 'Laboratory Request' capability as a referral, since docs/03-sad/15-module-emr.md does not define a separate dedicated Laboratory module (see Dependency Detail note).

## Depends On

- Phase 1 task-048

## Required Documents

- **AI Contract:** docs/04-ai-contract/07-module-contract.md
- **PRD:** docs/01-prd/features/emr.md
- **SAD:** docs/03-sad/15-module-emr.md Section 26 (Referral & Follow Up -- Referral targets: Specialist, Hospital, Laboratory, Radiology)
- **Design:** No page-level spec exists yet (documented gap).

## Required Existing Code

Phase 1 task-048.

## Backend Scope

- CreateReferralUseCase: persist a referral with target type (Specialist/Hospital/Laboratory/Radiology), reason, and any accompanying note, linked to the Visit.
- Endpoint path convention-derived, e.g. POST /api/v1/emr/visits/{visitId}/referrals.

## Frontend Scope

- Referral creation form within the Visit/EMR screen.

## Database Impact

- New referrals table linked to Visit.

## API Impact

- Adds the Referral creation endpoint.

## Workflow Impact

Administrative/clinical output; does not itself trigger an external lab/radiology integration (none is specified in the SAD).

## Security Impact

- Gated by emr.referral.create permission (Doctor role).
- Audit Trail entry required.

## Testing Required

- Unit test: referral persists with correct target type and reason.

## Deliverables

- CreateReferralUseCase, controller, route, DTOs, tests, frontend form.

## Acceptance Criteria

- Referral created and retrievable, correctly typed.

## Definition of Done

- Implemented, tested, permission-gated, audit-logged.
- Ambiguity resolved/flagged: 'Laboratory Request' and 'Radiology Request' in the roadmap's Phase 2 New Capabilities list do not correspond to dedicated modules in docs/03-sad/ -- Radiology is covered by the general Attachment module's X-Ray category (task-078), and Laboratory has no dedicated result-tracking module at all. This task implements the Referral mechanism (the only Laboratory-specific SAD content found); a full Laboratory Order/Result Management module, if actually required, is not specified anywhere in the source documentation and must not be invented here.

---

## Dependency Detail

- **Blocked By:** Phase 1 task-048.
- **Required Before:** None blocking.
- **Can Run In Parallel With:** task-086 through task-088, task-090.
