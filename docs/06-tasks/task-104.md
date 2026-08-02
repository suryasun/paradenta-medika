# task-104: Purchase Order (Entity & Migration)

**Phase:** Phase 3 - Operational Excellence
**Epic:** W. Procurement
**Feature:** W1. Purchase Order
**Module:** Warehouse
**Priority:** P0 - Blocking

---

## Business Goal

Create the `PurchaseOrder` aggregate (header + line items, status lifecycle draft/submitted/approved/rejected/cancelled) and migration per docs/03-sad/18-module-warehouse.md UC-WHS-001 (Create/Approve PO), delivering the roadmap 'Purchase Request' and 'Procurement' features.

## Depends On

- task-095
- task-098
- task-100
- task-013 (Authentication Middleware)
- task-014 (Authorization Middleware)
- task-006 (Audit Trail Service)

## Required Documents

- **AI Contract:** docs/04-ai-contract/07-module-contract.md, docs/04-ai-contract/04-api-contract.md, docs/04-ai-contract/06-database-contract.md, docs/04-ai-contract/09-security-contract.md
- **PRD:** docs/01-prd/features/warehouse.md, docs/01-prd/business-rules.md § 7
- **SAD:** docs/03-sad/18-module-warehouse.md (Section 4.2 UC-WHS-001 Create/Approve PO, Section 5 Data Model, Section 6.2 API)
- **Design:** No page-level spec exists yet (documented gap in docs/02-design/pages/overview.md) — follow CLAUDE.md frontend rules until a design spec exists.

## Required Existing Code

task-095, task-098, task-100, task-013, task-014, task-006.

## Backend Scope

- Domain layer: `PurchaseOrder` aggregate with status lifecycle (draft → submitted → approved/rejected → cancelled) per UC-WHS-001 business rules.
- Infrastructure layer: Prisma migration for `warehouse_purchase_orders` and `warehouse_purchase_order_items`.
- `IPurchaseOrderRepository` interface + Prisma implementation.

## Frontend Scope

No dedicated page in this task; backend-only per Backend Scope. Any UI consuming this endpoint is scoped to a later frontend task once docs/02-design coverage exists.

## Database Impact

Creates warehouse_purchase_orders and warehouse_purchase_order_items tables (FK to items, suppliers, warehouses).

## API Impact

None in this task (endpoints in task-105 through task-110).

## Workflow Impact

Foundational for the Purchase Request → Procurement workflow (UC-WHS-001).

## Security Impact

No direct endpoint; downstream gated by procurement permissions; maker-checker enforced at approve step.

## Testing Required

- Unit tests for the Use Case/Entity (per docs/05-testing/unit-tests.md).
- Integration test for Controller/Repository (per docs/05-testing/api-tests.md).

## Deliverables

- `PurchaseOrder` aggregate
- `IPurchaseOrderRepository` + Prisma implementation
- Migration for warehouse_purchase_orders(_items)

## Acceptance Criteria

Per docs/01-prd/acceptance-criteria/warehouse.md (sourced from docs/03-sad/18-module-warehouse.md):

- Status lifecycle matches UC-WHS-001 exactly (no skipped states).
- Approver cannot equal requester (maker-checker) per docs/01-prd/business-rules.md § 7.

## Definition of Done

Aggregate and migration implemented and unit-tested.

---

## Dependency Detail

- **Blocked By:** task-095, task-098, task-100, task-013, task-014, task-006
- **Required Before:** See phase-3-plan.md Implementation Order.
- **Can Run In Parallel With:** Tasks in other Epics once own dependencies are satisfied.
