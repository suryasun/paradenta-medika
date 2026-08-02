# task-259: Payment Gateway Provider Integration

**Phase:** Phase 6 - Healthcare Ecosystem
**Epic:** DC. Payment Gateway
**Feature:** DC1. Provider Integration
**Module:** Billing
**Priority:** P1 - High

---

## Business Goal

Implement online payment initiation via a selected payment gateway provider, per docs/03-sad/16-module-billing.md's Section 12 Future Enhancement 'Payment Gateway Integration', which names three literal candidate providers (Midtrans, Xendit, Stripe) without selecting one, delivering the roadmap 'Payment Gateway' item.

## Depends On

- Phase 1 Billing Basic's Create Invoice and Receive Payment tasks
- task-013 (Authentication Middleware)
- task-014 (Authorization Middleware)
- task-006 (Audit Trail Service)

## Required Documents

- **AI Contract:** docs/04-ai-contract/07-module-contract.md, docs/04-ai-contract/04-api-contract.md, docs/04-ai-contract/06-database-contract.md, docs/04-ai-contract/09-security-contract.md
- **PRD:** docs/01-prd/features/billing.md, docs/01-prd/business-rules.md § 5
- **SAD:** docs/03-sad/16-module-billing.md (Section 12 Future Enhancement (Payment Gateway Integration: Midtrans, Xendit, Stripe), Section 13 Technical Roadmap (Phase 3 row: Payment Gateway), Section 1 API Overview ('External Payment Gateway (Future)'))
- **Design:** No page-level spec exists yet (documented gap in docs/02-design/pages/overview.md) — follow CLAUDE.md frontend rules until a design spec exists.

## Required Existing Code

Phase 1's Invoice and Payment entities, task-013, task-014, task-006.

## Backend Scope

- Provider selection must be confirmed during implementation among the three literal candidates (Midtrans, Xendit, Stripe) against actual Indonesian-market payment-method coverage and pricing — not guessed here.
- Application layer: `InitiatePaymentGatewayTransactionUseCase` — creates a payment-gateway transaction reference against an existing Invoice, returning the provider's hosted-checkout URL or client token.
- Presentation layer: route, controller for `POST /billing/invoices/{id}/payment-gateway-transactions` (convention-derived).

## Frontend Scope

No dedicated page in this task; backend-only per Backend Scope. Any UI consuming this endpoint is scoped to a later frontend task once docs/02-design coverage exists.

## Database Impact

Adds a payment_gateway_transactions table (or extends the existing payments table) tracking provider reference, status, and amount.

## API Impact

Adds POST /billing/invoices/{id}/payment-gateway-transactions.

## Workflow Impact

Extends Phase 1's Receive Payment workflow with an online payment initiation path, completing this half of the roadmap 'Payment Gateway' item (webhook confirmation is task-260).

## Security Impact

Provider API keys sourced from Secret Management (Phase 5 task-252). No card data ever touches Parakita's own servers (hosted-checkout/tokenized flow only, per standard PCI-DSS scope-reduction practice).

## Testing Required

- Unit tests for the Use Case/Entity (per docs/05-testing/unit-tests.md).
- Integration test for Controller/Repository (per docs/05-testing/api-tests.md).

## Deliverables

- `InitiatePaymentGatewayTransactionUseCase`, route, controller, tests

## Acceptance Criteria

Per docs/01-prd/acceptance-criteria/billing.md:

- A payment-gateway transaction is correctly created and linked to its source Invoice.
- No raw card data is logged or persisted by Parakita.

## Definition of Done

Endpoint implemented and tested. **Ambiguity flagged:** provider selection among the three literal candidates must be made and documented during implementation.

---

## Dependency Detail

- **Blocked By:** Phase 1 Billing Basic's Create Invoice task
- **Required Before:** See phase-6-plan.md Implementation Order.
- **Can Run In Parallel With:** Tasks in other Epics once own dependencies are satisfied.
