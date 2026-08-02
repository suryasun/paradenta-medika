# task-269: Patient Mobile App API Surface — Design Spike

**Phase:** Phase 6 - Healthcare Ecosystem
**Epic:** DG. Patient Mobile App
**Feature:** DG2. Mobile API Design
**Module:** Reservation
**Priority:** P2 - Medium

---

## Business Goal

Produce the missing technical design for a dedicated Patient Mobile App, since docs/03-sad/01-system-overview.md explicitly lists 'Mobile Application' as Out of Scope for the initial implementation and every other mention across the SAD marks it 'Future' with no dedicated API surface, authentication model, or push-notification design beyond what task-291's narrow self-check-in slice already covers.

## Depends On

- task-268 (Patient Self-Check-In and QR Code Check-In)

## Required Documents

- **AI Contract:** docs/04-ai-contract/07-module-contract.md, docs/04-ai-contract/04-api-contract.md, docs/04-ai-contract/06-database-contract.md, docs/04-ai-contract/09-security-contract.md
- **PRD:** docs/01-prd/features/reservation.md, docs/01-prd/business-rules.md § 3
- **SAD:** docs/03-sad/01-system-overview.md (Section 3.2 Out of Scope ('Mobile Application'), Section 3.3 Future Scope) and docs/03-sad/13-module-reservation.md Section 37.2/37.3 (Mobile App marked Future/Phase 3-4)
- **Design:** No page-level spec exists yet (documented gap in docs/02-design/pages/overview.md) — follow CLAUDE.md frontend rules until a design spec exists.

## Required Existing Code

task-268.

## Backend Scope

This task does NOT implement a full mobile app backend. Deliverable is an ADR covering: (a) which existing REST endpoints (already built across Phase 1–5) a Patient Mobile App would consume versus which need a mobile-specific shape (e.g. condensed responses), (b) mobile authentication strategy (the existing JWT+refresh-token design from task-007 vs. a mobile-specific token lifetime), (c) push notification provider selection (extending Phase 3's Notification Center, task-195–199), and (d) offline/low-connectivity behavior expectations.

## Frontend Scope

No dedicated page in this task; backend-only per Backend Scope. Any UI consuming this endpoint is scoped to a later frontend task once docs/02-design coverage exists.

## Database Impact

None (design task).

## API Impact

None beyond task-291's narrow self-check-in slice, which already ships independently of this broader design.

## Workflow Impact

Unblocks a full native/PWA Patient Mobile App build once this ADR is approved.

## Security Impact

The ADR must address mobile-specific threats (lost/stolen device token revocation, reusing task-020's Revoke User Sessions pattern).

## Testing Required

- Not applicable (no code produced). Verification is architecture review sign-off.

## Deliverables

- An ADR covering API surface, authentication, push notifications, and offline behavior

## Acceptance Criteria

Per docs/01-prd/acceptance-criteria/reservation.md:

- The ADR is reviewed and approved by the project's architecture owner.

## Definition of Done

ADR authored and approved. Broader mobile-app implementation explicitly BLOCKED pending this ADR; task-291's self-check-in slice already stands on its own and is not blocked.

---

## Dependency Detail

- **Blocked By:** task-268
- **Required Before:** See phase-6-plan.md Implementation Order.
- **Can Run In Parallel With:** Tasks in other Epics once own dependencies are satisfied.
