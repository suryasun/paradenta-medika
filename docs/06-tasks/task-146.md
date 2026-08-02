# task-146: Journal (Entity & Migration)

**Phase:** Phase 3 - Operational Excellence
**Epic:** AC. Journals
**Feature:** AC1. Manual & System Journal
**Module:** Finance
**Priority:** P0 - Blocking

---

## Business Goal

Create the `Journal` aggregate (header + balanced debit/credit lines) and migration per docs/03-sad/17-module-finance.md UC-FIN-002 Create/Post Manual Journal, the ledger-of-record for all Finance Integration.

## Depends On

- task-143
- task-013 (Authentication Middleware)
- task-014 (Authorization Middleware)
- task-006 (Audit Trail Service)

## Required Documents

- **AI Contract:** docs/04-ai-contract/07-module-contract.md, docs/04-ai-contract/04-api-contract.md, docs/04-ai-contract/06-database-contract.md, docs/04-ai-contract/09-security-contract.md
- **PRD:** docs/01-prd/features/finance.md, docs/01-prd/business-rules.md § 6
- **SAD:** docs/03-sad/17-module-finance.md (Section 4 UC-FIN-002 Create/Post Manual Journal, Section 5 Data Model, Section 6.2 API)
- **Design:** No page-level spec exists yet (documented gap in docs/02-design/pages/overview.md) — follow CLAUDE.md frontend rules until a design spec exists.

## Required Existing Code

task-143, task-013, task-014, task-006.

## Backend Scope

- Domain layer: `Journal` aggregate (branchId, journalDate, description, immutable journalNumber, status draft/posted/reversed/voided, lines with debit/credit) per Section 6.2's Create Manual Journal example. Domain invariant: sum(debit) == sum(credit) (else `FIN_JOURNAL_UNBALANCED`).
- Infrastructure layer: Prisma migration for `finance_journals` and `finance_journal_lines`.
- `IJournalRepository` interface + Prisma implementation.

## Frontend Scope

No dedicated page in this task; backend-only per Backend Scope. Any UI consuming this endpoint is scoped to a later frontend task once docs/02-design coverage exists.

## Database Impact

Creates finance_journals and finance_journal_lines tables.

## API Impact

None in this task (endpoints in task-147 through task-152).

## Workflow Impact

Foundational ledger for UC-FIN-002 and consumed by every downstream Finance workflow (UC-FIN-001, 003–007).

## Security Impact

No direct endpoint; downstream posting requires `finance.journal.post` (segregation of duties: creator cannot self-post per `FIN_SEGREGATION_OF_DUTIES`).

## Testing Required

- Unit tests for the Use Case/Entity (per docs/05-testing/unit-tests.md).
- Integration test for Controller/Repository (per docs/05-testing/api-tests.md).

## Deliverables

- `Journal` aggregate
- `IJournalRepository` + Prisma implementation
- Migration for finance_journals(_lines)

## Acceptance Criteria

Per docs/01-prd/acceptance-criteria/finance.md (sourced from docs/03-sad/17-module-finance.md):

- Domain layer rejects unbalanced lines before persistence (`FIN_JOURNAL_UNBALANCED`).
- journalNumber is generated immutably once posted.

## Definition of Done

Aggregate and migration implemented and unit-tested including the balance invariant.

---

## Dependency Detail

- **Blocked By:** task-143, task-013, task-014, task-006
- **Required Before:** See phase-3-plan.md Implementation Order.
- **Can Run In Parallel With:** Tasks in other Epics once own dependencies are satisfied.
