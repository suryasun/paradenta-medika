# task-053: Record Treatment Entry (basic, EMR-008/009 combined)

**Phase:** Phase 1 - Foundation (MVP)  
**Epic:** G. EMR Basic  
**Feature:** G2. Basic Clinical Documentation  
**Module:** EMR  
**Priority:** P0 - Blocking

---

## Business Goal

Allow the Doctor to record which billable Treatment(s) (from the Treatment catalog, task-025) were performed during the visit -- the data Billing needs to generate an invoice.

## Depends On

- task-048
- task-025 (Treatment master data)
- task-051

## Required Documents

- **AI Contract:** docs/04-ai-contract/07-module-contract.md
- **PRD:** docs/01-prd/features/emr.md, docs/01-prd/business-rules.md ("Tindakan akan menghasilkan item Billing" per docs/03-sad/01-system-overview.md Section 20.4)
- **SAD:** docs/03-sad/15-module-emr.md Section 14 (EMR-008 Create Treatment Plan, EMR-009 Record Procedure -- Phase 1 combines these into one basic entry rather than the full Treatment Plan workflow, which docs/03-sad/26-roadmap.md Phase 2 lists as a distinct new capability)
- **Design:** No page-level spec exists yet (documented gap).

## Required Existing Code

task-048, task-025, task-051 (diagnosis typically precedes treatment selection).

## Backend Scope

- RecordTreatmentUseCase: select one or more Treatment catalog items (task-025) against the Visit, capturing quantity/tooth reference if applicable and the price snapshot at time of entry (so later Treatment price changes don't retroactively alter historical visits).
- Basic tooth/position reference may be a simple free-text or numeric field for Phase 1 -- the full Interactive Odontogram (EMR-012) is explicitly out of scope per the Phase 2 roadmap note above; do not build the full odontogram UI here.

## Frontend Scope

- Treatment selection UI (search/select from Treatment catalog) within the Visit/EMR screen, with simple tooth-number text input rather than the full odontogram.

## Database Impact

- Inserts visit_treatments rows (FK to visits, treatments) with a price snapshot column.

## API Impact

- Adds the Treatment Entry endpoint scoped under the Visit resource.

## Workflow Impact

Directly feeds task-054 (Generate Invoice) -- each visit_treatments row becomes an invoice line item.

## Security Impact

- Gated by emr.treatment.record permission (Doctor role).
- Audit Trail entry required.

## Testing Required

- Unit test: recording a treatment against a deactivated Treatment catalog item is rejected (task-025's business rule).
- Unit test: price is snapshotted at entry time, not recalculated later.

## Deliverables

- RecordTreatmentUseCase, controller, route, DTOs, tests.

## Acceptance Criteria

- Treatment entries persist with a price snapshot and are retrievable against the Visit.
- Data recorded here maps cleanly to Invoice line items in task-054.

## Definition of Done

- Implemented, tested, permission-gated, audit-logged.

---

## Dependency Detail

- **Blocked By:** task-048, task-025.
- **Required Before:** task-052 (Close Visit), task-054 (Generate Invoice).
- **Can Run In Parallel With:** task-049, task-050.
