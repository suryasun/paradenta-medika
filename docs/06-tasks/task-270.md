# task-270: Doctor Mobile App API Surface — Design Spike

**Phase:** Phase 6 - Healthcare Ecosystem
**Epic:** DH. Doctor Mobile App
**Feature:** DH1. Mobile API Design
**Module:** Reservation
**Priority:** P2 - Medium

---

## Business Goal

Produce the missing technical design for a Doctor Mobile App, grounded in the single literal mention 'Doctor Mobile App' in docs/03-sad/13-module-reservation.md Section 37.2's Phase 3 mobile roadmap, with zero further detail anywhere else in the SAD.

## Depends On

- Phase 1 Authentication (task-007)
- Phase 3 Queue module

## Required Documents

- **AI Contract:** docs/04-ai-contract/07-module-contract.md, docs/04-ai-contract/04-api-contract.md, docs/04-ai-contract/06-database-contract.md, docs/04-ai-contract/09-security-contract.md
- **PRD:** docs/01-prd/features/reservation.md, docs/01-prd/business-rules.md § 3
- **SAD:** docs/03-sad/13-module-reservation.md (Section 37.2 Phase 3 ('Doctor Mobile App'))
- **Design:** No page-level spec exists yet (documented gap in docs/02-design/pages/overview.md) — follow CLAUDE.md frontend rules until a design spec exists.

## Required Existing Code

Phase 1's Authentication module, Phase 1's Queue module (Epic F).

## Backend Scope

This task does NOT implement a Doctor Mobile App backend. Deliverable is an ADR covering: (a) which existing doctor-facing endpoints (Queue's Doctor Calling flow, Reservation schedule, EMR clinical entry) a Doctor Mobile App would need, (b) whether mobile clinical documentation entry (writing SOAP notes from a phone) is in scope or the app is read/notification-only, and (c) push notification requirements for queue-call alerts.

## Frontend Scope

No dedicated page in this task; backend-only per Backend Scope. Any UI consuming this endpoint is scoped to a later frontend task once docs/02-design coverage exists.

## Database Impact

None (design task).

## API Impact

None (design task); implementation explicitly BLOCKED pending this ADR.

## Workflow Impact

Unblocks a Doctor Mobile App build once this ADR is approved.

## Security Impact

The ADR must address whether a doctor entering clinical documentation from a personal mobile device introduces device-trust requirements beyond the existing JWT session model.

## Testing Required

- Not applicable (no code produced). Verification is architecture review sign-off.

## Deliverables

- An ADR covering API surface, clinical-entry scope, and notification requirements

## Acceptance Criteria

Per docs/01-prd/acceptance-criteria/reservation.md:

- The ADR is reviewed and approved by the project's architecture owner.

## Definition of Done

ADR authored and approved. Implementation explicitly BLOCKED pending this ADR, per CLAUDE.md's Missing Information rule.

---

## Dependency Detail

- **Blocked By:** Phase 1 Authentication, Phase 1 Queue module
- **Required Before:** See phase-6-plan.md Implementation Order.
- **Can Run In Parallel With:** Tasks in other Epics once own dependencies are satisfied.
