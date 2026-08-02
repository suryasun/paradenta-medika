# task-258: External Insurance / BPJS Clearinghouse Integration — Design Spike

**Phase:** Phase 6 - Healthcare Ecosystem
**Epic:** DB. Insurance Platform
**Feature:** DB2. External Clearinghouse
**Module:** Billing
**Priority:** P2 - Medium

---

## Business Goal

Produce the missing technical design for electronically submitting insurance claims to an external payer/BPJS clearinghouse, since docs/03-sad/12-module-patient.md only lists 'Insurance Integration | Integrasi BPJS / Asuransi' as a one-line Future Enhancement with no protocol, authentication, or claim-format specification.

## Depends On

- task-257 (Apply and Remove Invoice Insurance)

## Required Documents

- **AI Contract:** docs/04-ai-contract/07-module-contract.md, docs/04-ai-contract/04-api-contract.md, docs/04-ai-contract/06-database-contract.md, docs/04-ai-contract/09-security-contract.md
- **PRD:** docs/01-prd/features/billing.md, docs/01-prd/business-rules.md § 5
- **SAD:** docs/03-sad/12-module-patient.md (Section 30 Future Enhancements ('Insurance Integration | Integrasi BPJS / Asuransi'))
- **Design:** No page-level spec exists yet (documented gap in docs/02-design/pages/overview.md) — follow CLAUDE.md frontend rules until a design spec exists.

## Required Existing Code

task-257.

## Backend Scope

This task does NOT implement a live BPJS/insurer connection — no SAD document specifies BPJS's claim-submission API, authentication, or claim-status polling contract. Deliverable is an ADR covering: (a) which insurer/BPJS integration to prioritize, (b) the claim data required beyond what task-268's insurance allocation already captures, (c) claim-status tracking and reconciliation against task-268's coverage amount, and (d) error/rejection handling.

## Frontend Scope

No dedicated page in this task; backend-only per Backend Scope. Any UI consuming this endpoint is scoped to a later frontend task once docs/02-design coverage exists.

## Database Impact

None (design task).

## API Impact

None (design task); live claim-submission endpoints are explicitly BLOCKED pending this ADR.

## Workflow Impact

Unblocks future clearinghouse integration work once BPJS/insurer API documentation is obtained.

## Security Impact

The ADR must address the sensitivity of transmitting patient billing and clinical-justification data to an external insurer.

## Testing Required

- Not applicable (no code produced). Verification is architecture review sign-off.

## Deliverables

- An ADR covering claim submission scope, data requirements, status tracking, and error handling

## Acceptance Criteria

Per docs/01-prd/acceptance-criteria/billing.md:

- The ADR is reviewed and approved by the project's architecture owner.

## Definition of Done

ADR authored and approved. Implementation explicitly BLOCKED pending this ADR and actual external API documentation, per CLAUDE.md's Missing Information rule.

---

## Dependency Detail

- **Blocked By:** task-257
- **Required Before:** See phase-6-plan.md Implementation Order.
- **Can Run In Parallel With:** Tasks in other Epics once own dependencies are satisfied.
