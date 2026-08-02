# task-106: Get and Update Purchase Order (GET/PATCH /warehouse/purchase-orders/{purchaseOrderId})

**Phase:** Phase 3 - Operational Excellence
**Epic:** W. Procurement
**Feature:** W1. Purchase Order
**Module:** Warehouse
**Priority:** P0 - Blocking

---

## Business Goal

Allow a PO in `draft` status to be viewed and edited before submission.

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

- Presentation layer: route, controller, DTO/validator for `GET/PATCH /warehouse/purchase-orders/{purchaseOrderId}`.
- Application layer: `GetPurchaseOrderUseCase / UpdatePurchaseOrderUseCase`, gated by `warehouse.item.manage (procurement scope)`.

## Frontend Scope

No dedicated page in this task; backend-only per Backend Scope. Any UI consuming this endpoint is scoped to a later frontend task once docs/02-design coverage exists.

## Database Impact

Updates warehouse_purchase_orders (status transition and audit fields).

## API Impact

Adds GET/PATCH /warehouse/purchase-orders/{purchaseOrderId} per docs/03-sad/18-module-warehouse.md Section 6.2.

## Workflow Impact

Step in the Purchase Request → Procurement approval workflow (UC-WHS-001).

## Security Impact

Gated by warehouse.item.manage (procurement scope). Audit Trail entry required. Maker-checker enforced where applicable (approver ≠ requester).

## Testing Required

- Unit tests for the Use Case/Entity (per docs/05-testing/unit-tests.md).
- Integration test for Controller/Repository (per docs/05-testing/api-tests.md).

## Deliverables

- `GetPurchaseOrderUseCase / UpdatePurchaseOrderUseCase`, route, controller, DTOs, tests

## Acceptance Criteria

Per docs/01-prd/acceptance-criteria/warehouse.md (sourced from docs/03-sad/18-module-warehouse.md):

- Update rejected once PO is submitted/approved (must be draft).
- 404 when purchaseOrderId not found.

## Definition of Done

Use case implemented and tested; status transition matches UC-WHS-001.

---

## Dependency Detail

- **Blocked By:** task-104
- **Required Before:** See phase-3-plan.md Implementation Order.
- **Can Run In Parallel With:** Tasks in other Epics once own dependencies are satisfied.
