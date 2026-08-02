# task-108: Approve Purchase Order (POST /purchase-orders/{purchaseOrderId}/approve)

**Phase:** Phase 3 - Operational Excellence
**Epic:** W. Procurement
**Feature:** W1. Purchase Order
**Module:** Warehouse
**Priority:** P0 - Blocking

---

## Business Goal

Transition a submitted PO to `approved`, enforcing maker-checker (approver ≠ requester) per UC-WHS-001.

## Depends On

- task-104
- task-013 (Authentication Middleware)
- task-014 (Authorization Middleware)
- task-006 (Audit Trail Service)

## Required Documents

- **AI Contract:** docs/04-ai-contract/07-module-contract.md, docs/04-ai-contract/04-api-contract.md, docs/04-ai-contract/06-database-contract.md, docs/04-ai-contract/09-security-contract.md
- **PRD:** docs/01-prd/features/warehouse.md, docs/01-prd/business-rules.md § 7
- **SAD:** docs/03-sad/18-module-warehouse.md (Section 4.2 UC-WHS-001 Create/Approve PO, Section 6.2 Purchase dan Goods Receipt)
- **Design:** No page-level spec exists yet (documented gap in docs/02-design/pages/overview.md) — follow CLAUDE.md frontend rules until a design spec exists.

## Required Existing Code

task-104, task-013, task-014, task-006.

## Backend Scope

- Presentation layer: route, controller, DTO/validator for `POST /warehouse/purchase-orders/{purchaseOrderId}/approve`.
- Application layer: `ApprovePurchaseOrderUseCase`, gated by `procurement approve permission`.

## Frontend Scope

No dedicated page in this task; backend-only per Backend Scope. Any UI consuming this endpoint is scoped to a later frontend task once docs/02-design coverage exists.

## Database Impact

Updates warehouse_purchase_orders (status transition and audit fields).

## API Impact

Adds POST /warehouse/purchase-orders/{purchaseOrderId}/approve per docs/03-sad/18-module-warehouse.md Section 6.2.

## Workflow Impact

Step in the Purchase Request → Procurement approval workflow (UC-WHS-001).

## Security Impact

Gated by procurement approve permission. Audit Trail entry required. Maker-checker enforced where applicable (approver ≠ requester).

## Testing Required

- Unit tests for the Use Case/Entity (per docs/05-testing/unit-tests.md).
- Integration test for Controller/Repository (per docs/05-testing/api-tests.md).

## Deliverables

- `ApprovePurchaseOrderUseCase`, route, controller, DTOs, tests

## Acceptance Criteria

Per docs/01-prd/acceptance-criteria/warehouse.md (sourced from docs/03-sad/18-module-warehouse.md):

- Rejects self-approval.
- `WHS_PO_NOT_APPROVED` (409) is the error returned by Goods Receipt when this state hasn't been reached — verified via integration test with task-114.

## Definition of Done

Use case implemented and tested; status transition matches UC-WHS-001.

---

## Dependency Detail

- **Blocked By:** task-104
- **Required Before:** See phase-3-plan.md Implementation Order.
- **Can Run In Parallel With:** Tasks in other Epics once own dependencies are satisfied.
