# task-260: Payment Gateway Webhook Handler

**Phase:** Phase 6 - Healthcare Ecosystem
**Epic:** DC. Payment Gateway
**Feature:** DC2. Webhook Confirmation
**Module:** Billing
**Priority:** P1 - High

---

## Business Goal

Implement the payment-gateway webhook receiver per docs/03-sad/25-security.md Section 12 Webhook Security's literal validation checklist (HMAC Signature, Timestamp Validation, Replay Protection, IP Whitelist, Event Verification), completing the payment-gateway confirmation loop started by task-269.

## Depends On

- task-259 (Payment Gateway Provider Integration)

## Required Documents

- **AI Contract:** docs/04-ai-contract/07-module-contract.md, docs/04-ai-contract/04-api-contract.md, docs/04-ai-contract/06-database-contract.md, docs/04-ai-contract/09-security-contract.md
- **PRD:** docs/01-prd/features/billing.md, docs/01-prd/business-rules.md § 5
- **SAD:** docs/03-sad/25-security.md (Section 12 Webhook Security (Validation: HMAC Signature, Timestamp Validation, Replay Protection, IP Whitelist, Event Verification; Webhook Flow: Webhook Request → Verify Signature → Validate Timestamp → Validate Event → Process Request)) and docs/03-sad/16-module-billing.md Section 1 API Overview ('External Payment Gateway (Future)')
- **Design:** No page-level spec exists yet (documented gap in docs/02-design/pages/overview.md) — follow CLAUDE.md frontend rules until a design spec exists.

## Required Existing Code

task-259, task-013, task-014, task-006.

## Backend Scope

- Presentation layer: route, controller for `POST /billing/webhooks/payment-gateway` implementing the literal Webhook Flow exactly: verify HMAC signature → validate timestamp (reject stale requests) → validate event type → process.
- Application layer: `ProcessPaymentGatewayWebhookUseCase` — on a verified successful-payment event, marks the corresponding task-269 transaction and its source Invoice as paid (reusing the existing Receive Payment domain logic from Phase 1, not duplicating it); on a verified failure event, marks the transaction failed.
- IP Whitelist restricted to the selected provider's published webhook source ranges.

## Frontend Scope

No dedicated page in this task; backend-only per Backend Scope. Any UI consuming this endpoint is scoped to a later frontend task once docs/02-design coverage exists.

## Database Impact

Updates the payment_gateway_transactions table and the source Invoice/Payment records.

## API Impact

Adds POST /billing/webhooks/payment-gateway.

## Workflow Impact

Completes the roadmap 'Payment Gateway' item end-to-end: initiate (task-269) → external payment → webhook confirmation (this task) → Invoice marked paid.

## Security Impact

All five literal Webhook Security validations enforced; a request failing any one of them is rejected before any business logic runs. Replay protection prevents a captured webhook from being replayed to double-credit a payment.

## Testing Required

- Unit tests for the Use Case/Entity (per docs/05-testing/unit-tests.md).
- Integration test for Controller/Repository (per docs/05-testing/api-tests.md).

## Deliverables

- `ProcessPaymentGatewayWebhookUseCase`, route, controller, tests
- Tests for each of the five literal validation failures (invalid signature, stale timestamp, replay, non-whitelisted IP, unrecognized event type)

## Acceptance Criteria

Per docs/01-prd/acceptance-criteria/billing.md:

- A webhook with an invalid HMAC signature is rejected before any Invoice state changes.
- A replayed (previously-processed) webhook does not double-credit the Invoice.
- A verified successful-payment webhook correctly marks the Invoice as paid.

## Definition of Done

Webhook handler implemented and tested against all five literal validation checks plus the happy path.

---

## Dependency Detail

- **Blocked By:** task-259
- **Required Before:** See phase-6-plan.md Implementation Order.
- **Can Run In Parallel With:** Tasks in other Epics once own dependencies are satisfied.
