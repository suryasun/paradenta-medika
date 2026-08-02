# task-167: Approve and Pay Doctor Fee Settlement

**Phase:** Phase 3 - Operational Excellence
**Epic:** AE. Daily Closing, Settlement & Period
**Feature:** AE3. Doctor Fee Settlement
**Module:** Finance
**Priority:** P1 - High

---

## Business Goal

Implement `ApproveDoctorFeeSettlementUseCase` and `PayDoctorFeeSettlementUseCase`, completing UC-FIN-006.

## Depends On

- task-166 (Generate Settlement)
- task-153

## Required Documents

- **AI Contract:** docs/04-ai-contract/07-module-contract.md, docs/04-ai-contract/04-api-contract.md, docs/04-ai-contract/06-database-contract.md, docs/04-ai-contract/09-security-contract.md
- **PRD:** docs/01-prd/features/finance.md, docs/01-prd/business-rules.md § 6
- **SAD:** docs/03-sad/17-module-finance.md (Section 4 UC-FIN-006, Section 6.4 Closing, Settlement, and Period)
- **Design:** No page-level spec exists yet (documented gap in docs/02-design/pages/overview.md) — follow CLAUDE.md frontend rules until a design spec exists.

## Required Existing Code

task-166, task-153, task-013, task-014, task-006.

## Backend Scope

- Presentation layer: routes/controllers for `POST /finance/doctor-fee-settlements/{settlementId}/approve` and `POST /finance/doctor-fee-settlements/{settlementId}/pay`.
- Application layer: `ApproveDoctorFeeSettlementUseCase` (maker-checker), `PayDoctorFeeSettlementUseCase` (posts a Journal and updates CashAccount balance, mirroring Pay Expense).

## Frontend Scope

No dedicated page in this task; backend-only per Backend Scope. Any UI consuming this endpoint is scoped to a later frontend task once docs/02-design coverage exists.

## Database Impact

Updates finance_doctor_fee_settlements status; inserts a posted Journal on pay.

## API Impact

Adds POST /finance/doctor-fee-settlements/{settlementId}/approve, POST /finance/doctor-fee-settlements/{settlementId}/pay.

## Workflow Impact

Completion of UC-FIN-006 Settle Doctor Fee.

## Security Impact

`FIN_SEGREGATION_OF_DUTIES` enforced on approve. `Idempotency-Key` required on pay. Audit Trail entry required.

## Testing Required

- Unit tests for the Use Case/Entity (per docs/05-testing/unit-tests.md).
- Integration test for Controller/Repository (per docs/05-testing/api-tests.md).

## Deliverables

- `ApproveDoctorFeeSettlementUseCase`, `PayDoctorFeeSettlementUseCase`, routes, controllers, tests

## Acceptance Criteria

Per docs/01-prd/acceptance-criteria/finance.md (sourced from docs/03-sad/17-module-finance.md):

- Pay rejected unless settlement is `approved`.
- Resulting Journal is balanced.

## Definition of Done

Both use cases implemented and tested.

---

## Dependency Detail

- **Blocked By:** task-166, task-153
- **Required Before:** See phase-3-plan.md Implementation Order.
- **Can Run In Parallel With:** Tasks in other Epics once own dependencies are satisfied.
