# task-216: Branch Scope Authorization Guard (Cross-Cutting Middleware Extension)

**Phase:** Phase 4 - Multi Branch Platform
**Epic:** BC. Branch-Level Access Control
**Feature:** BC1. Enforcement
**Module:** System
**Priority:** P0 - Blocking

---

## Business Goal

Extend the Phase 1 Authorization middleware (task-014) with a reusable `BranchScopeGuard` that every branch-scoped controller across every module (Reservation, Queue, EMR, Billing, Warehouse, Finance, Reporting) can apply, so branch-level access control is enforced consistently rather than re-implemented per module — the technical backbone of the roadmap 'Branch-Level Access Control' capability.

## Depends On

- task-014 (Authorization Middleware)
- task-210 (Assign Branch to User)

## Required Documents

- **AI Contract:** docs/04-ai-contract/07-module-contract.md, docs/04-ai-contract/04-api-contract.md, docs/04-ai-contract/06-database-contract.md, docs/04-ai-contract/09-security-contract.md, docs/04-ai-contract/05-auth-contract.md
- **PRD:** docs/01-prd/features/system.md, docs/01-prd/business-rules.md § 10
- **SAD:** docs/03-sad/21-module-system.md (Section 8.1 Authorization Model, Section 2.1 Responsibility Matrix ('server-derived branch scope' pattern referenced across every module's API spec))
- **Design:** No page-level spec exists yet (documented gap in docs/02-design/pages/overview.md) — follow CLAUDE.md frontend rules until a design spec exists.

## Required Existing Code

task-014, task-210, task-006.

## Backend Scope

- Infrastructure layer: `BranchScopeGuard`, a composable middleware/decorator that resolves the requester's assigned branch(es) (via task-210's assignment table) and rejects or intersects any request whose target branchId falls outside that scope — implementing the 'API requests never accept raw permission claims as authority' rule (Section 6 API Specification preamble) for branch scope specifically, mirroring how every module's endpoint table already declares 'branch-aware authorisation' without a shared implementation.
- Cross-branch roles (Owner, Administrator, Security Admin) bypass the intersection per the Actor Matrix pattern used throughout Section 4.1 of every module reviewed.

## Frontend Scope

No dedicated page in this task; backend-only per Backend Scope. Any UI consuming this endpoint is scoped to a later frontend task once docs/02-design coverage exists.

## Database Impact

Read-only; queries system_user_branches (task-210) on every guarded request (cacheable).

## API Impact

No new endpoint; this is a reusable guard applied to existing and future controllers.

## Workflow Impact

Retroactively hardens every already-implemented branch-scoped endpoint from Phase 1–3 (Reservation, Queue, EMR, Billing, Warehouse, Finance, Reporting) that currently states 'branch-aware authorisation' in its SAD section without a literal, testable implementation reference.

## Security Impact

Central enforcement point for branch-level access control; a bypass here is a bypass everywhere it's applied. `SYS_BRANCH_SCOPE_INVALID`-style rejection for out-of-scope requests.

## Testing Required

- Unit tests for the Use Case/Entity (per docs/05-testing/unit-tests.md).
- Integration test for Controller/Repository (per docs/05-testing/api-tests.md).

## Deliverables

- `BranchScopeGuard` middleware/decorator
- Retrofit guide + example wiring on at least one endpoint per already-implemented module
- Unit + integration tests including a cross-branch-role bypass test

## Acceptance Criteria

Per docs/01-prd/acceptance-criteria/system.md:

- A non-cross-branch user's request targeting an unassigned branch is rejected.
- A cross-branch role (Owner/Administrator/Security Admin) is not blocked.
- Guard is demonstrably reusable (applied to at least Reservation, Billing, and Warehouse in the test suite as a proof of retrofit).

## Definition of Done

Guard implemented, tested, and demonstrated on representative existing endpoints. **Ambiguity flagged (see phase-4-plan.md):** retrofitting this guard onto every one of the ~200 endpoints built in Phase 1–3 is out of scope for a single AI implementation session; this task delivers the guard and a documented retrofit pattern, not a full retrofit of every prior endpoint.

---

## Dependency Detail

- **Blocked By:** task-014, task-210
- **Required Before:** See phase-4-plan.md Implementation Order.
- **Can Run In Parallel With:** Tasks in other Epics once own dependencies are satisfied.
