# task-267: Video Consultation Session — Design Spike

**Phase:** Phase 6 - Healthcare Ecosystem
**Epic:** DF. Telemedicine
**Feature:** DF2. Video Session
**Module:** Reservation
**Priority:** P3 - Low

---

## Business Goal

Produce the missing technical design for the actual video-consultation mechanism, since neither docs/03-sad/13-module-reservation.md nor docs/03-sad/15-module-emr.md specify a video provider, session-recording policy, or clinical-documentation integration for a telemedicine visit beyond the two narrative mentions already used to ground task-288.

## Depends On

- task-266 (Telemedicine Appointment and Consent)

## Required Documents

- **AI Contract:** docs/04-ai-contract/07-module-contract.md, docs/04-ai-contract/04-api-contract.md, docs/04-ai-contract/06-database-contract.md, docs/04-ai-contract/09-security-contract.md
- **PRD:** docs/01-prd/features/reservation.md, docs/01-prd/business-rules.md § 3
- **SAD:** docs/03-sad/13-module-reservation.md (No dedicated video-session specification exists; grounded only in the same 'Telemedicine Appointment' and 'Persetujuan telemedicine' narrative mentions used for task-288)
- **Design:** No page-level spec exists yet (documented gap in docs/02-design/pages/overview.md) — follow CLAUDE.md frontend rules until a design spec exists.

## Required Existing Code

task-266.

## Backend Scope

This task does NOT implement a live video-call feature. Deliverable is an ADR covering: (a) video provider selection (WebRTC self-hosted vs. a third-party SDK — neither is named anywhere in the SAD), (b) session-recording policy and its interaction with medical-record retention rules, (c) how a completed telemedicine session feeds back into EMR clinical documentation (does the doctor still fill out a normal Visit record?), and (d) bandwidth/connectivity fallback behavior.

## Frontend Scope

No dedicated page in this task; backend-only per Backend Scope. Any UI consuming this endpoint is scoped to a later frontend task once docs/02-design coverage exists.

## Database Impact

None (design task).

## API Impact

None (design task); implementation explicitly BLOCKED pending this ADR.

## Workflow Impact

Unblocks future video-consultation implementation once a provider and recording policy are decided.

## Security Impact

The ADR must address end-to-end encryption expectations for a video consultation carrying clinical discussion.

## Testing Required

- Not applicable (no code produced). Verification is architecture review sign-off.

## Deliverables

- An ADR covering provider selection, recording policy, EMR integration, and fallback behavior

## Acceptance Criteria

Per docs/01-prd/acceptance-criteria/reservation.md:

- The ADR is reviewed and approved by the project's architecture owner.

## Definition of Done

ADR authored and approved. Implementation explicitly BLOCKED pending this ADR, per CLAUDE.md's Missing Information rule.

---

## Dependency Detail

- **Blocked By:** task-266
- **Required Before:** See phase-6-plan.md Implementation Order.
- **Can Run In Parallel With:** Tasks in other Epics once own dependencies are satisfied.
