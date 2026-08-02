# task-099: Create and List Supplier (POST/GET /warehouse/suppliers)

**Phase:** Phase 3 - Operational Excellence
**Epic:** V. Warehouse Foundation
**Feature:** V2. Supplier Management
**Module:** Warehouse
**Priority:** P0 - Blocking

---

## Business Goal

Implement `CreateSupplierUseCase` and `ListSuppliersUseCase` per docs/03-sad/18-module-warehouse.md Section 6.1, delivering the roadmap Phase 3 'Supplier Management' feature.

## Depends On

- task-098 (Supplier entity)
- task-013 (Authentication Middleware)
- task-014 (Authorization Middleware)
- task-006 (Audit Trail Service)

## Required Documents

- **AI Contract:** docs/04-ai-contract/07-module-contract.md, docs/04-ai-contract/04-api-contract.md, docs/04-ai-contract/06-database-contract.md, docs/04-ai-contract/09-security-contract.md
- **PRD:** docs/01-prd/features/warehouse.md, docs/01-prd/business-rules.md § 7
- **SAD:** docs/03-sad/18-module-warehouse.md (Section 6.1 Item, Supplier, dan Warehouse)
- **Design:** No page-level spec exists yet (documented gap in docs/02-design/pages/overview.md) — follow CLAUDE.md frontend rules until a design spec exists.

## Required Existing Code

task-098, task-013, task-014, task-006.

## Backend Scope

- Presentation layer: route, controller, request DTO/validator for `GET/POST /warehouse/suppliers`.
- Application layer: `CreateSupplierUseCase`, `ListSuppliersUseCase`.
- Permission gating: `warehouse.supplier.read` (GET), `warehouse.supplier.manage` (POST).

## Frontend Scope

No dedicated page in this task; backend-only per Backend Scope. Any UI consuming this endpoint is scoped to a later frontend task once docs/02-design coverage exists.

## Database Impact

Inserts into warehouse_suppliers.

## API Impact

Adds GET/POST /warehouse/suppliers.

## Workflow Impact

Required before Purchase Order creation can reference a supplier.

## Security Impact

Gated by warehouse.supplier.read / warehouse.supplier.manage. Audit Trail entry required for Create.

## Testing Required

- Unit tests for the Use Case/Entity (per docs/05-testing/unit-tests.md).
- Integration test for Controller/Repository (per docs/05-testing/api-tests.md).

## Deliverables

- `CreateSupplierUseCase`, `ListSuppliersUseCase`
- DTOs, Route + Controller wiring
- Unit + integration tests

## Acceptance Criteria

Per docs/01-prd/acceptance-criteria/warehouse.md (sourced from docs/03-sad/18-module-warehouse.md):

- Create Supplier succeeds with valid payload; duplicate identifier rejected.
- List supports pagination/filter.

## Definition of Done

Both use cases implemented and tested.

---

## Dependency Detail

- **Blocked By:** task-098, task-013, task-014, task-006
- **Required Before:** See phase-3-plan.md Implementation Order.
- **Can Run In Parallel With:** Tasks in other Epics once own dependencies are satisfied.
