# task-140: Purchases Report (GET /warehouse/reports/purchases)

**Phase:** Phase 3 - Operational Excellence
**Epic:** AA. Warehouse Reporting
**Feature:** AA1. Reports
**Module:** Warehouse
**Priority:** P2 - Medium

---

## Business Goal

Implement `GetPurchasesReportUseCase` exposing `GET /warehouse/reports/purchases` per docs/03-sad/18-module-warehouse.md Section 6.5 Reports, so Warehouse Staff can review po/receipt/vendor analysis.

## Depends On

- task-102
- task-103
- task-104 (Purchase Order)
- task-111 (Goods Receipt)
- task-013 (Authentication Middleware)
- task-014 (Authorization Middleware)

## Required Documents

- **AI Contract:** docs/04-ai-contract/07-module-contract.md, docs/04-ai-contract/04-api-contract.md, docs/04-ai-contract/06-database-contract.md, docs/04-ai-contract/09-security-contract.md
- **PRD:** docs/01-prd/features/warehouse.md, docs/01-prd/business-rules.md § 7
- **SAD:** docs/03-sad/18-module-warehouse.md (Section 6.5 Reports dan Error Codes, Section 4.5 Inventory Reports (business rule source))
- **Design:** No page-level spec exists yet (documented gap in docs/02-design/pages/overview.md) — follow CLAUDE.md frontend rules until a design spec exists.

## Required Existing Code

task-102, task-103, task-013, task-014.

## Backend Scope

- Presentation layer: route, controller, query DTO/validator for `GET /warehouse/reports/purchases`.
- Application layer: `GetPurchasesReportUseCase`, read-only, sourced from warehouse_purchase_orders and warehouse_goods_receipts.

## Frontend Scope

No dedicated page in this task; backend-only per Backend Scope. Any UI consuming this endpoint is scoped to a later frontend task once docs/02-design coverage exists.

## Database Impact

Read-only; queries existing Warehouse tables.

## API Impact

Adds GET /warehouse/reports/purchases.

## Workflow Impact

Supports Inventory Management operational visibility (roadmap 'Advanced Reporting' dependency for Warehouse domain data).

## Security Impact

Gated by warehouse report-read permission; branch/warehouse-scoped per assignment.

## Testing Required

- Unit tests for the Use Case/Entity (per docs/05-testing/unit-tests.md).
- Integration test for Controller/Repository (per docs/05-testing/api-tests.md).

## Deliverables

- `GetPurchasesReportUseCase`, route, controller, tests

## Acceptance Criteria

Per docs/01-prd/acceptance-criteria/warehouse.md (sourced from docs/03-sad/18-module-warehouse.md):

- Output matches the PO/receipt/vendor analysis shape defined in Section 6.5.
- Filter/pagination validated server-side per docs/04-ai-contract/04-api-contract.md.

## Definition of Done

Endpoint implemented and tested.

---

## Dependency Detail

- **Blocked By:** task-102, task-103
- **Required Before:** See phase-3-plan.md Implementation Order.
- **Can Run In Parallel With:** Tasks in other Epics once own dependencies are satisfied.
