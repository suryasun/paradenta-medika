# task-257: Apply and Remove Invoice Insurance (POST/DELETE /billing/invoices/{id}/insurance)

**Phase:** Phase 6 - Healthcare Ecosystem
**Epic:** DB. Insurance Platform
**Feature:** DB1. Internal Insurance Allocation
**Module:** Billing
**Priority:** P1 - High

---

## Business Goal

Implement `ApplyInsuranceUseCase` and `RemoveInsuranceUseCase` per docs/03-sad/16-module-billing.md UC-BIL-006 Apply Insurance — a literal, already-specified Billing capability that was not built in Phase 1's Billing Basic epic — allocating a portion of an invoice to an insurance payer, with the remainder billed to the patient.

## Depends On

- task-XXX (Create Invoice, Phase 1 Billing Basic — exact task id per phase-1-plan.md Epic H)
- task-013 (Authentication Middleware)
- task-014 (Authorization Middleware)
- task-006 (Audit Trail Service)

## Required Documents

- **AI Contract:** docs/04-ai-contract/07-module-contract.md, docs/04-ai-contract/04-api-contract.md, docs/04-ai-contract/06-database-contract.md, docs/04-ai-contract/09-security-contract.md
- **PRD:** docs/01-prd/features/billing.md, docs/01-prd/business-rules.md § 5
- **SAD:** docs/03-sad/16-module-billing.md (Section 'UC-BIL-006 Apply Insurance' (Goal: Mengalokasikan pembayaran ke pihak asuransi; Main Flow: Pilih Insurance → Sistem menghitung coverage → Remaining menjadi tagihan pasien), API Insurance table (POST/DELETE /billing/invoices/{id}/insurance), Error BIL-008 Insurance Validation Failed)
- **Design:** No page-level spec exists yet (documented gap in docs/02-design/pages/overview.md) — follow CLAUDE.md frontend rules until a design spec exists.

## Required Existing Code

The Phase 1 Invoice entity/CreateInvoiceUseCase (Epic H), task-013, task-014, task-006.

## Backend Scope

- Domain layer: extend the `Invoice` aggregate with an `insuranceAllocation` (payer, coverageAmount, coveragePercentage) per UC-BIL-006's flow: select insurance, system computes coverage, remaining balance becomes the patient's bill.
- Application layer: `ApplyInsuranceUseCase` (POST) and `RemoveInsuranceUseCase` (DELETE) per the literal API table.
- Validation returning `BIL-008 Insurance Validation Failed` when the insurance selection or coverage calculation is invalid (e.g. insurance company/plan not configured, coverage exceeds invoice total).

## Frontend Scope

No dedicated page in this task; backend-only per Backend Scope. Any UI consuming this endpoint is scoped to a later frontend task once docs/02-design coverage exists.

## Database Impact

Extends the invoices table (or a related insurance_allocations table) with insurance allocation fields.

## API Impact

Adds POST /billing/invoices/{id}/insurance, DELETE /billing/invoices/{id}/insurance per the literal Billing API spec.

## Workflow Impact

Completes UC-BIL-006, a literal use case that was in scope for Billing from the start but not included in Phase 1's initial task set — closing a real, pre-existing gap rather than adding new roadmap scope.

## Security Impact

Gated by a billing-insurance-manage permission. Audit Trail entry required (insurance allocation directly affects patient-owed amount).

## Testing Required

- Unit tests for the Use Case/Entity (per docs/05-testing/unit-tests.md).
- Integration test for Controller/Repository (per docs/05-testing/api-tests.md).

## Deliverables

- Invoice aggregate extension
- `ApplyInsuranceUseCase`, `RemoveInsuranceUseCase`, routes, controllers, tests

## Acceptance Criteria

Per docs/01-prd/acceptance-criteria/billing.md:

- Applying insurance correctly reduces the patient-owed remaining balance by the computed coverage amount.
- `BIL-008` returned for an invalid insurance selection or an over-coverage attempt.
- Removing insurance correctly restores the patient-owed balance to the pre-insurance total.

## Definition of Done

Both use cases implemented and tested against the literal UC-BIL-006 flow and the BIL-008 error code.

---

## Dependency Detail

- **Blocked By:** Phase 1 Billing Basic's Create Invoice task
- **Required Before:** See phase-6-plan.md Implementation Order.
- **Can Run In Parallel With:** Tasks in other Epics once own dependencies are satisfied.
