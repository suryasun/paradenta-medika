# task-123: Approve Stock Adjustment (POST /adjustments/{adjustmentId}/approve)

**Phase:** Phase 3 - Operational Excellence
**Epic:** X. Stock Movement
**Feature:** X2. Adjustment
**Module:** Warehouse
**Priority:** P1 - High

---

## Business Goal

Implement `ApproveStockAdjustmentUseCase`, enforcing the `WHS_ADJUSTMENT_APPROVAL_REQUIRED` gate before posting.

## Depends On

- task-122 (Create Adjustment)

## Required Documents

- **AI Contract:** docs/04-ai-contract/07-module-contract.md, docs/04-ai-contract/04-api-contract.md, docs/04-ai-contract/06-database-contract.md, docs/04-ai-contract/09-security-contract.md
- **PRD:** docs/01-prd/features/warehouse.md, docs/01-prd/business-rules.md § 7
- **SAD:** docs/03-sad/18-module-warehouse.md (Section 4.2 UC-WHS-005, Section 6.5 Error Codes)
- **Design:** No page-level spec exists yet (documented gap in docs/02-design/pages/overview.md) — follow CLAUDE.md frontend rules until a design spec exists.

## Required Existing Code

task-122, task-013, task-014, task-006.

## Backend Scope

- Presentation layer: route, controller for `POST /warehouse/adjustments/{adjustmentId}/approve`.
- Application layer: `ApproveStockAdjustmentUseCase`, maker-checker enforced (approver ≠ requester).

## Frontend Scope

No dedicated page in this task; backend-only per Backend Scope. Any UI consuming this endpoint is scoped to a later frontend task once docs/02-design coverage exists.

## Database Impact

Updates warehouse_adjustments status to approved.

## API Impact

Adds POST /warehouse/adjustments/{adjustmentId}/approve.

## Workflow Impact

Approval gate of UC-WHS-005.

## Security Impact

Gated by adjustment-approve permission. Rejects self-approval. Audit Trail entry required.

## Testing Required

- Unit tests for the Use Case/Entity (per docs/05-testing/unit-tests.md).
- Integration test for Controller/Repository (per docs/05-testing/api-tests.md).

## Deliverables

- `ApproveStockAdjustmentUseCase`, route, controller, tests

## Acceptance Criteria

Per docs/01-prd/acceptance-criteria/warehouse.md (sourced from docs/03-sad/18-module-warehouse.md):

- `WHS_ADJUSTMENT_APPROVAL_REQUIRED` (403) returned if Post is attempted before this step.

## Definition of Done

Use case implemented and tested.

---

## Dependency Detail

- **Blocked By:** task-122
- **Required Before:** See phase-3-plan.md Implementation Order.
- **Can Run In Parallel With:** Tasks in other Epics once own dependencies are satisfied.
