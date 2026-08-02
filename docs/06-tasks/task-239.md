# task-239: Data Warehouse ETL Pipeline

**Phase:** Phase 5 - Enterprise Platform
**Epic:** CF. Data Warehouse & Business Intelligence
**Feature:** CF1. ETL Pipeline
**Module:** Reporting
**Priority:** P1 - High

---

## Business Goal

Implement the Data Warehouse ETL pipeline (OLTP → CDC → ETL → Data Warehouse → Business Intelligence) per docs/03-sad/15-module-emr.md Section 11, with the literal Fact/Dimension table set defined there, realizing the roadmap 'Data Warehouse' item and docs/03-sad/20-module-report.md's own Phase 4 roadmap enhancement 'Data warehouse/lakehouse'.

## Depends On

- task-178 (Reporting Read-Model Projection Infrastructure, Phase 3)
- task-226 (Dedicated Database Server, Phase 4)

## Required Documents

- **AI Contract:** docs/04-ai-contract/07-module-contract.md, docs/04-ai-contract/04-api-contract.md, docs/04-ai-contract/09-security-contract.md
- **PRD:** docs/01-prd/features/reporting.md, docs/01-prd/business-rules.md § 9
- **SAD:** docs/03-sad/15-module-emr.md (Section 11 Data Warehouse (ETL Flow: OLTP Database → CDC → ETL → Data Warehouse → Business Intelligence; Fact Tables: Fact Visit, Fact Treatment, Fact Revenue, Fact Queue, Fact Inventory; Dimension Tables: Doctor, Branch, Patient, Procedure, Time)) and docs/03-sad/20-module-report.md Section 12.3 Roadmap (Phase 4 row: 'Data warehouse/lakehouse')
- **Design:** No page-level spec exists yet (documented gap in docs/02-design/pages/overview.md) — follow CLAUDE.md frontend rules until a design spec exists.

## Required Existing Code

task-178, task-226, task-013, task-014, task-006.

## Backend Scope

- Infrastructure layer: CDC (Change Data Capture) mechanism against the OLTP database (dedicated instance from task-226), feeding an ETL process into a separate analytical Data Warehouse schema (star-schema, per the literal Fact/Dimension list in Section 11).
- Domain layer: `FactVisit`, `FactTreatment`, `FactRevenue`, `FactQueue`, `FactInventory` fact tables and `DimDoctor`, `DimBranch`, `DimPatient`, `DimProcedure`, `DimTime` dimension tables, exactly as named in Section 11 — no additional fact/dimension tables are invented beyond this literal list.
- ETL respects the Reporting module's existing read-only, least-privilege source-access rule (docs/03-sad/20-module-report.md Section 12.1): the warehouse is populated from the same event/projection sources Reporting already consumes (task-178), not by new direct-database access into other modules' schemas.

## Frontend Scope

No dedicated page in this task; backend-only per Backend Scope. Any UI consuming this endpoint is scoped to a later frontend task once docs/02-design coverage exists.

## Database Impact

Creates a separate analytical Data Warehouse database/schema with the five Fact and five Dimension tables named above.

## API Impact

None directly (this task is the pipeline; task-259 exposes it via BI KPIs).

## Workflow Impact

Foundational for the Business Intelligence KPI layer (task-259) and for Reporting's own Phase 4 roadmap maturity ('Data warehouse/lakehouse').

## Security Impact

Warehouse access is read-only for downstream consumers; ETL process credentials are least-privilege and sourced from Secret Management (task-252).

## Testing Required

- Unit tests for the Use Case/Entity (per docs/05-testing/unit-tests.md).
- Integration test for Controller/Repository (per docs/05-testing/api-tests.md).

## Deliverables

- CDC/ETL pipeline
- Fact/Dimension schema migrations exactly matching Section 11's literal table list
- Data-quality reconciliation check (warehouse totals match source-of-truth totals for at least Fact Revenue against Finance's posted journals)

## Acceptance Criteria

Per docs/01-prd/acceptance-criteria/reporting.md:

- All five named Fact tables and five named Dimension tables exist and are populated.
- Fact Revenue reconciles against Finance's posted-journal totals (Phase 3 task-172 Trial Balance) for a sample period.

## Definition of Done

Pipeline implemented, schema matches the literal Section 11 list exactly, and the revenue reconciliation check passes.

---

## Dependency Detail

- **Blocked By:** task-178, task-226
- **Required Before:** See phase-5-plan.md Implementation Order.
- **Can Run In Parallel With:** Tasks in other Epics once own dependencies are satisfied.
