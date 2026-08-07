# task-332: Apply Insurance (Payment Payer Allocation)

**Epic:** Billing Module Completion, Stage 3 (`docs/06-tasks/epic-billing-completion.md`)
**Module:** Billing / Master Data
**Priority:** P2 - Medium
**Status:** Implemented

---

## Business Goal

Implement UC-BIL-006 "Apply Insurance" (`docs/03-sad/16-module-billing.md`) per the decision recorded in `docs/adr/ADR-001-insurance-coverage-model.md` (Status: Proposed, acted on by explicit user instruction "start implement code task-332"): the SAD's own wording — "mengalokasikan pembayaran ke pihak asuransi" ("allocate PAYMENT to the insurance party") — reframes Insurance as a **Payment allocation**, not a new Coverage/Claim subsystem. This task implements exactly that: a Payment line can now be tagged as paid by an Insurance Provider instead of the Patient directly, reusing the existing `CreatePaymentUseCase` rather than building new endpoints.

Explicitly **not** built (per ADR-001, still deferred): a coverage-calculation formula, an `InsurancePlan`/coverage-rule sub-entity, automated coverage rules, live insurer integration, and the SAD's literal `/invoices/{id}/insurance` endpoint shape. The coverage/allocation `amount` is Cashier-entered on the Payment line itself, same as any other payment — not system-computed, because no formula is documented anywhere in the SAD or PRD.

## Depends On

- task-331 (Design Spike / ADR-001 — insurance coverage model decision)
- task-057 (Create Payment — this task extends it rather than replacing it)
- task-026 (Payment Method master data — `InsuranceProvider` mirrors this entity's shape)

## Required Documents

- **ADR:** `docs/adr/ADR-001-insurance-coverage-model.md`
- **SAD:** `docs/03-sad/16-module-billing.md` UC-BIL-006 "Apply Insurance"

## Required Existing Code

`CreatePaymentUseCase.ts` (extended, not replaced), `IPaymentRepository`/`PaymentRepository.ts`, `PaymentMethodRepository.ts` + `IPaymentMethodRepository.ts` (the exact pattern `InsuranceProviderRepository.ts`/`IInsuranceProviderRepository.ts` mirrors), `buildCrudUseCases()`/`buildCrudController()` generic Master Data factory, `CreatePaymentRequestDto.ts`.

## Backend Scope

- **Schema:** `Payment` gained `payerType` (`String @default("PATIENT")`), `insuranceProviderId` (nullable FK), `policyNumber` (nullable). Every pre-existing Payment row is implicitly `'PATIENT'` — no backfill needed, additive migration only.
- New `InsuranceProvider` master data model (`id`, `providerName`, `isActive`, standard audit columns) — minimal flat list, no `InsurancePlan`/coverage-rule sub-entity (deferred, per ADR-001, until a real coverage-rule requirement exists).
- New Master Data CRUD: `IInsuranceProviderRepository`/`InsuranceProviderRepository.ts` (mirrors `PaymentMethodRepository.ts`), wired through the generic `buildCrudUseCases()`/`buildCrudController()` factory at `GET/POST /master-data/insurance-providers`, `GET/PUT /master-data/insurance-providers/:id`.
- `CreatePaymentUseCase.ts` extended: each `PaymentLineDto` may carry `payerType` (`'PATIENT' | 'INSURANCE'`, defaults to `'PATIENT'`), `insuranceProviderId`, `policyNumber`. When `payerType === 'INSURANCE'`: `insuranceProviderId` is required (`ValidationException` otherwise) and must reference an existing, active `InsuranceProvider` (`InsuranceProviderNotActiveException` otherwise, mirroring `PaymentMethodNotActiveException`'s existing pattern). The use-case now takes `IInsuranceProviderRepository` as a constructor dependency.
- `GET /billing/invoices/:id` payment rows now expose `payerType`/`insuranceProviderId`/`policyNumber` (`PaymentResponseDto`/`InvoiceMapper.ts`).
- New permissions: `masterdata.insurance-provider.manage`, `masterdata.insurance-provider.read` (granted to CASHIER for `.read`, ADMINISTRATOR gets all by default). No new permission needed on the payment side — `billing.payment.create` already gates the (now-extended) `CreatePaymentUseCase`.

## Frontend Scope

- New Master Data admin screen: `InsuranceProvidersAdminPage.tsx` (mirrors `PaymentMethodsAdminPage.tsx`), `insuranceProvider.service.ts`, `useInsuranceProviders.ts` hook, route at `/master-data/insurance-providers`, nav entry under Master Data.
- `CreatePaymentModal.tsx`: each payment line gets a "Payer" toggle (Patient/Insurance). When Insurance is selected, an Insurance Provider dropdown and a Policy Number field appear inline; both are required before that line can submit.
- `InvoiceDetailView.tsx`: each payment row in the Payments table shows a Payer badge (Patient, or the Insurance Provider's name + policy number).

## Database Impact

Additive migration only: `payments.payer_type` (VARCHAR, default `'PATIENT'`), `payments.insurance_provider_id` (nullable FK), `payments.policy_number` (nullable VARCHAR); new `insurance_providers` table.

## API Impact

- `POST /billing/payments` (existing endpoint, extended payload): each entry in `payments[]` may now include `payerType`, `insuranceProviderId`, `policyNumber`.
- `GET /billing/invoices/:id`: payment objects gain `payerType`/`insuranceProviderId`/`policyNumber`.
- New: `GET/POST /master-data/insurance-providers`, `GET/PUT /master-data/insurance-providers/:id`.
- The SAD's literal `/invoices/{id}/insurance` endpoint is explicitly **not** built (ADR-001 decision).

## Workflow Impact

None beyond the existing Create Payment workflow — Insurance is a payer classification on a Payment line, not a new workflow state. `Invoice.paidAmount`/`status` are computed identically regardless of `payerType`.

## Security Impact

New permissions `masterdata.insurance-provider.manage`/`.read`, RBAC-gated the same way as every other Master Data entity. No new attack surface on the payment path — `insuranceProviderId` is validated server-side against the Insurance Provider table (active-only), same discipline as `paymentMethodId`.

## Testing Required

- Unit (`CreatePaymentUseCase`): accepts an Insurance-payer line and records `payerType`/`insuranceProviderId`/`policyNumber` on the created Payment; defaults `payerType` to `PATIENT` when omitted; rejects an Insurance-payer line missing `insuranceProviderId`; rejects an Insurance-payer line referencing an inactive Insurance Provider.
- Frontend (`CreatePaymentModal.test.tsx`): submits a Patient-payer line unchanged; submits an Insurance-payer line with `insuranceProviderId`/`policyNumber`.
- Full backend suite (185 suites / 745 tests) and full frontend suite (52 suites / 195 tests) re-run green after this change.

## Deliverables

Migration (`Payment.payerType`/`insuranceProviderId`/`policyNumber`, `InsuranceProvider` table), `IInsuranceProviderRepository`/`InsuranceProviderRepository.ts`, Master Data CRUD routes, extended `CreatePaymentUseCase.ts`, `InsuranceProviderNotActiveException`, extended `PaymentResponseDto`/`InvoiceMapper.ts`, frontend admin page + Payer toggle + payment-row badge, tests.

## Acceptance Criteria

- A Cashier can record a Payment line as paid by an Insurance Provider, entering the coverage amount, provider, and policy number.
- Insurance Provider must be active; inactive/nonexistent providers are rejected.
- Every existing (pre-task-332) Payment behaves identically (`payerType` defaults to `PATIENT`).
- Insurance Providers are manageable via Master Data (create/list/update/deactivate).

## Definition of Done

Insurance payment allocation shipped end-to-end (schema → backend → frontend), tests passing (backend + frontend full suites green), `business-rules.md` §5 updated, `epic-billing-completion.md` Stage 3 marked implemented.

---

## Dependency Detail

- **Blocked By:** task-331 (ADR-001), task-057
- **Required Before:** none (Stage 3 terminal for this scope; live insurer integration is a future enhancement, out of scope)
- **Can Run In Parallel With:** task-327/task-328 (Stage 4, not yet started)
