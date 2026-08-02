# task-147: Create Manual Journal (POST /finance/journals)

**Phase:** Phase 3 - Operational Excellence
**Epic:** AC. Journals
**Feature:** AC1. Manual & System Journal
**Module:** Finance
**Priority:** P0 - Blocking

---

## Business Goal

Implement journal creation in `draft` status per the Create Manual Journal example in Section 6.2.

## Depends On

- task-146

## Required Documents

- **AI Contract:** docs/04-ai-contract/07-module-contract.md, docs/04-ai-contract/04-api-contract.md, docs/04-ai-contract/06-database-contract.md, docs/04-ai-contract/09-security-contract.md
- **PRD:** docs/01-prd/features/finance.md, docs/01-prd/business-rules.md § 6
- **SAD:** docs/03-sad/17-module-finance.md (Section 4 UC-FIN-002 Create/Post Manual Journal, Section 6.2 Journals)
- **Design:** No page-level spec exists yet (documented gap in docs/02-design/pages/overview.md) — follow CLAUDE.md frontend rules until a design spec exists.

## Required Existing Code

task-146, task-013, task-014, task-006.

## Backend Scope

- Presentation layer: route, controller, DTO/validator for `POST /finance/journals`.
- Application layer: `CreateManualJournalUseCase`.

## Frontend Scope

No dedicated page in this task; backend-only per Backend Scope. Any UI consuming this endpoint is scoped to a later frontend task once docs/02-design coverage exists.

## Database Impact

Writes/updates finance_journals(_lines).

## API Impact

Adds POST /finance/journals per docs/03-sad/17-module-finance.md Section 6.2.

## Workflow Impact

Step in UC-FIN-002 (or the reversal/void variant).

## Security Impact

Gated by the corresponding finance.journal.* permission. `Idempotency-Key` required for post/reverse/void. Audit Trail entry required.

## Testing Required

- Unit tests for the Use Case/Entity (per docs/05-testing/unit-tests.md).
- Integration test for Controller/Repository (per docs/05-testing/api-tests.md).

## Deliverables

- `CreateManualJournalUseCase`, route, controller, tests

## Acceptance Criteria

Per docs/01-prd/acceptance-criteria/finance.md (sourced from docs/03-sad/17-module-finance.md):

- `FIN_JOURNAL_UNBALANCED` (422) returned when debit total != credit total.
- `FIN_ACCOUNT_NOT_POSTABLE` (422) returned when a line targets a non-postable account.

## Definition of Done

Use case implemented and tested.

---

## Dependency Detail

- **Blocked By:** task-146
- **Required Before:** See phase-3-plan.md Implementation Order.
- **Can Run In Parallel With:** Tasks in other Epics once own dependencies are satisfied.
