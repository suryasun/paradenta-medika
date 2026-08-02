# task-097: Get and Update Item (GET/PATCH /warehouse/items/{itemId})

**Phase:** Phase 3 - Operational Excellence
**Epic:** V. Warehouse Foundation
**Feature:** V1. Item Master Data
**Module:** Warehouse
**Priority:** P1 - High

---

## Business Goal

Implement `GetItemUseCase` and `UpdateItemUseCase` so an item's master data (minimum stock, tracking flags) can be viewed and corrected.

## Depends On

- task-095 (Item entity)
- task-013 (Authentication Middleware)
- task-014 (Authorization Middleware)
- task-006 (Audit Trail Service)

## Required Documents

- **AI Contract:** docs/04-ai-contract/07-module-contract.md, docs/04-ai-contract/04-api-contract.md, docs/04-ai-contract/06-database-contract.md, docs/04-ai-contract/09-security-contract.md
- **PRD:** docs/01-prd/features/warehouse.md, docs/01-prd/business-rules.md § 7
- **SAD:** docs/03-sad/18-module-warehouse.md (Section 6.1 Item, Supplier, dan Warehouse)
- **Design:** No page-level spec exists yet (documented gap in docs/02-design/pages/overview.md) — follow CLAUDE.md frontend rules until a design spec exists.

## Required Existing Code

task-095, task-013, task-014, task-006.

## Backend Scope

- Presentation layer: route, controller, request DTO/validator for `GET/PATCH /warehouse/items/{itemId}`.
- Application layer: `GetItemUseCase`, `UpdateItemUseCase`.
- Permission gating: `warehouse.item.read` (GET), `warehouse.item.manage` (PATCH).

## Frontend Scope

No dedicated page in this task; backend-only per Backend Scope. Any UI consuming this endpoint is scoped to a later frontend task once docs/02-design coverage exists.

## Database Impact

Updates warehouse_items row.

## API Impact

Adds GET/PATCH /warehouse/items/{itemId}.

## Workflow Impact

Supports ongoing Inventory Management master-data maintenance.

## Security Impact

Gated by warehouse.item.read / warehouse.item.manage. Audit Trail entry required for Update.

## Testing Required

- Unit tests for the Use Case/Entity (per docs/05-testing/unit-tests.md).
- Integration test for Controller/Repository (per docs/05-testing/api-tests.md).

## Deliverables

- `GetItemUseCase`, `UpdateItemUseCase`
- `UpdateItemRequest` / `ItemResponse` DTOs
- Route + Controller wiring
- Unit + integration tests

## Acceptance Criteria

Per docs/01-prd/acceptance-criteria/warehouse.md (sourced from docs/03-sad/18-module-warehouse.md):

- 404 when itemId not found.
- Update rejects changing isBatchTracked/isExpiryTracked if the item already has stock ledger entries (per docs/01-prd/business-rules.md § 7 data-integrity rule).

## Definition of Done

Both use cases implemented and tested.

---

## Dependency Detail

- **Blocked By:** task-095, task-013, task-014, task-006
- **Required Before:** See phase-3-plan.md Implementation Order.
- **Can Run In Parallel With:** Tasks in other Epics once own dependencies are satisfied.
