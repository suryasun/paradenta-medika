# task-162: Automatic Billing Event — Post Payment to Finance (Event Consumer)

**Phase:** Phase 3 - Operational Excellence
**Epic:** AE. Daily Closing, Settlement & Period
**Feature:** AE1. Automatic Billing Event
**Module:** Finance
**Priority:** P0 - Blocking

---

## Business Goal

Implement the `RecordBillingPaymentUseCase` event consumer per docs/03-sad/17-module-finance.md UC-FIN-001 Post Billing Payment, delivering the roadmap Phase 3 Automation item 'Automatic Billing Event': when Billing records a successful payment, Finance automatically posts the corresponding system journal.

## Depends On

- task-143
- task-146
- task-153
- task-013 (Authentication Middleware)
- task-014 (Authorization Middleware)
- task-006 (Audit Trail Service)

## Required Documents

- **AI Contract:** docs/04-ai-contract/07-module-contract.md, docs/04-ai-contract/04-api-contract.md, docs/04-ai-contract/06-database-contract.md, docs/04-ai-contract/09-security-contract.md
- **PRD:** docs/01-prd/features/finance.md, docs/01-prd/business-rules.md § 6
- **SAD:** docs/03-sad/17-module-finance.md (Section 4 UC-FIN-001 Post Billing Payment, Section 6.6 Error Codes)
- **Design:** No page-level spec exists yet (documented gap in docs/02-design/pages/overview.md) — follow CLAUDE.md frontend rules until a design spec exists.

## Required Existing Code

task-143, task-146, task-153, task-013, task-014, task-006.

## Backend Scope

- Application layer: `RecordBillingPaymentUseCase`, an event-driven consumer subscribing to Billing's `PaymentReceived` domain event (per docs/03-sad/02-system-architecture.md Event Catalog). Within a DB transaction it creates and posts a system Journal debiting the mapped cash/bank account and crediting the mapped revenue/receivable account (per the account-mapping configuration referenced by `FIN_ACCOUNT_MAPPING_MISSING`), then updates the CashAccount balance.
- Idempotent per Billing payment reference (`FIN_DUPLICATE_POSTING` 409 on redelivery).

## Frontend Scope

No dedicated page in this task; backend-only per Backend Scope. Any UI consuming this endpoint is scoped to a later frontend task once docs/02-design coverage exists.

## Database Impact

Inserts a posted finance_journals(_lines) pair; updates finance_cash_accounts balance.

## API Impact

None (event-driven consumer; no new synchronous endpoint).

## Workflow Impact

Automates the Billing → Finance posting step of the Patient Journey's payment stage, per docs/03-sad/02-system-architecture.md cross-module event pattern.

## Security Impact

Runs as a trusted system worker (no end-user permission gate); writes carry a system-actor Audit Trail entry with correlation id back to the source Billing payment.

## Testing Required

- Unit tests for the Use Case/Entity (per docs/05-testing/unit-tests.md).
- Integration test for Controller/Repository (per docs/05-testing/api-tests.md).

## Deliverables

- `RecordBillingPaymentUseCase` event consumer
- Account-mapping configuration lookup
- Unit + integration tests including idempotent-redelivery test

## Acceptance Criteria

Per docs/01-prd/acceptance-criteria/finance.md (sourced from docs/03-sad/17-module-finance.md):

- `FIN_DUPLICATE_POSTING` semantics honored idempotently (redelivery is a safe no-op).
- `FIN_ACCOUNT_MAPPING_MISSING` (422) raised and surfaced to an operational alert (not silently dropped) when no mapping exists for the payment method.

## Definition of Done

Event consumer implemented, tested, and verified idempotent under redelivery. **Ambiguity flagged (see phase-3-plan.md):** the exact Phase 1 Billing task ID and literal `PaymentReceived` event schema are not enumerated as a literal event contract in the SAD sections reviewed for this phase; this task consumes the conceptual event named in UC-FIN-001 and the Event Catalog pattern. The literal event name/schema and the account-mapping configuration source must be confirmed against the Billing module's implementation (Phase 1 Epic H) before this consumer is wired to a live topic.

---

## Dependency Detail

- **Blocked By:** task-143, task-146, task-153
- **Required Before:** See phase-3-plan.md Implementation Order.
- **Can Run In Parallel With:** Tasks in other Epics once own dependencies are satisfied.
