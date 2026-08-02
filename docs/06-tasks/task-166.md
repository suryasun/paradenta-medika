# task-166: Doctor Fee Settlement — Generate (POST /doctor-fee-settlements/generate)

**Phase:** Phase 3 - Operational Excellence
**Epic:** AE. Daily Closing, Settlement & Period
**Feature:** AE3. Doctor Fee Settlement
**Module:** Finance
**Priority:** P1 - High

---

## Business Goal

Implement `GenerateDoctorFeeSettlementUseCase` per docs/03-sad/17-module-finance.md UC-FIN-006 Settle Doctor Fee, aggregating unsettled doctor-fee sources into a settlement batch.

## Depends On

- task-143
- task-146
- task-013 (Authentication Middleware)
- task-014 (Authorization Middleware)
- task-006 (Audit Trail Service)

## Required Documents

- **AI Contract:** docs/04-ai-contract/07-module-contract.md, docs/04-ai-contract/04-api-contract.md, docs/04-ai-contract/06-database-contract.md, docs/04-ai-contract/09-security-contract.md
- **PRD:** docs/01-prd/features/finance.md, docs/01-prd/business-rules.md § 6
- **SAD:** docs/03-sad/17-module-finance.md (Section 4 UC-FIN-006 Settle Doctor Fee, Section 6.4 Closing, Settlement, and Period)
- **Design:** No page-level spec exists yet (documented gap in docs/02-design/pages/overview.md) — follow CLAUDE.md frontend rules until a design spec exists.

## Required Existing Code

task-143, task-146, task-013, task-014, task-006.

## Backend Scope

- Domain layer: `DoctorFeeSettlement` aggregate.
- Infrastructure layer: Prisma migration for `finance_doctor_fee_settlements`.
- Application layer: `GenerateDoctorFeeSettlementUseCase` for `POST /finance/doctor-fee-settlements/generate` — aggregates unsettled doctor-fee source records into a draft settlement per doctor/period.

## Frontend Scope

No dedicated page in this task; backend-only per Backend Scope. Any UI consuming this endpoint is scoped to a later frontend task once docs/02-design coverage exists.

## Database Impact

Creates finance_doctor_fee_settlements table and inserts draft rows.

## API Impact

Adds POST /finance/doctor-fee-settlements/generate.

## Workflow Impact

First step of UC-FIN-006 Settle Doctor Fee.

## Security Impact

Gated by finance settlement permission. Audit Trail entry required.

## Testing Required

- Unit tests for the Use Case/Entity (per docs/05-testing/unit-tests.md).
- Integration test for Controller/Repository (per docs/05-testing/api-tests.md).

## Deliverables

- `DoctorFeeSettlement` aggregate, migration, repository
- `GenerateDoctorFeeSettlementUseCase`, route, controller, tests

## Acceptance Criteria

Per docs/01-prd/acceptance-criteria/finance.md (sourced from docs/03-sad/17-module-finance.md):

- `FIN_SETTLEMENT_SOURCE_USED` (409) returned if a source has already been included in a prior settlement (no double payment).

## Definition of Done

Entity, migration, and generate endpoint implemented and tested. **Ambiguity flagged:** the exact upstream source of 'doctor-fee source records' (e.g. per-treatment fee calculation) is not detailed as a literal schema in docs/03-sad/17-module-finance.md Section 4/5 beyond UC-FIN-006's narrative; implementation must confirm the source table/event with the EMR/Billing modules before generating settlements against real data.

---

## Dependency Detail

- **Blocked By:** task-143, task-146
- **Required Before:** See phase-3-plan.md Implementation Order.
- **Can Run In Parallel With:** Tasks in other Epics once own dependencies are satisfied.
