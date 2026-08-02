# task-052: Close Visit (EMR-015)

**Phase:** Phase 1 - Foundation (MVP)  
**Epic:** G. EMR Basic  
**Feature:** G1. Visit Lifecycle  
**Module:** EMR  
**Priority:** P0 - Blocking

---

## Business Goal

Finalize the Visit once clinical documentation and treatment entry are complete, transitioning it to Completed and triggering downstream Billing invoice generation.

## Depends On

- task-050
- task-051
- task-053

## Required Documents

- **AI Contract:** docs/04-ai-contract/08-workflow-contract.md
- **PRD:** docs/01-prd/features/emr.md, docs/01-prd/business-rules.md (EMR note)
- **SAD:** docs/03-sad/15-module-emr.md Section 14 (EMR-015), Section 15 (Business Rules: 'Visit tidak dapat dihapus setelah Completed'; Status Draft/Waiting Examination/In Progress/Completed/Locked/Archived)
- **Design:** No page-level spec exists yet (documented gap).

## Required Existing Code

task-048, task-050, task-051, task-053 (Treatment entry), task-044 (Complete Queue -- coordination point).

## Backend Scope

- CloseVisitUseCase: validate the Visit has the minimum required documentation (at minimum a SOAP note and at least one Treatment entry, per the module's clinical completeness expectations -- exact minimum-fields-to-close rule should be confirmed against docs/03-sad/15-module-emr.md rather than assumed), transition status to Completed, and publish the EMRFinished / EMR Completed domain event (docs/03-sad/02-system-architecture.md Section 24.1: 'EMRFinished | EMR | Billing') that task-054 (Generate Invoice) subscribes to.

## Frontend Scope

- 'Close Visit' / 'Finish Examination' action on the Visit/EMR screen.

## Database Impact

- Updates visits.status to Completed.

## API Impact

- Adds the Close Visit endpoint scoped under the Visit resource.

## Workflow Impact

This is the exact seam between Epic G (EMR) and Epic H (Billing) in the critical path: EMR Finished -> Generate Invoice (docs/03-sad/01-system-overview.md Section 23).

## Security Impact

- Gated by emr.visit.close permission (Doctor role).
- Once Completed, the Visit cannot be deleted; reopening requires Administrator + Audit Trail per the Locked-state rule.

## Testing Required

- Unit test: closing a Visit with no Treatment entries is rejected (or handled per the confirmed minimum-documentation rule).
- Integration test: closing a Visit triggers Invoice generation (task-054) exactly once.

## Deliverables

- CloseVisitUseCase, controller, route, DTOs, tests, event publication.

## Acceptance Criteria

- Visit transitions to Completed only when minimum documentation exists.
- EMRFinished event is published and consumed by Billing.
- A Completed Visit cannot be deleted.

## Definition of Done

- Implemented, tested, permission-gated, audit-logged, cross-module event verified against task-054.

---

## Dependency Detail

- **Blocked By:** task-050, task-051, task-053.
- **Required Before:** task-054 (Generate Invoice) is triggered by this task's event.
- **Can Run In Parallel With:** None -- synchronization point between Epic G and Epic H.
