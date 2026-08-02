# task-234: Policy Simulation ("What-If" Permission Check)

**Phase:** Phase 5 - Enterprise Platform
**Epic:** CB. Enterprise RBAC
**Feature:** CB3. Policy Simulation
**Module:** System
**Priority:** P2 - Medium

---

## Business Goal

Implement `SimulatePolicyUseCase`, realizing docs/03-sad/21-module-system.md Section 12.3's 'policy simulation' roadmap item — letting a Security Admin preview whether a proposed role/permission/branch-scope change would grant or deny a specific action, before applying it via task-203's Approve Configuration Change Request flow.

## Depends On

- task-018 (Assign Permissions to Role)
- task-203 (Approve Configuration Change Request)

## Required Documents

- **AI Contract:** docs/04-ai-contract/07-module-contract.md, docs/04-ai-contract/04-api-contract.md, docs/04-ai-contract/06-database-contract.md, docs/04-ai-contract/09-security-contract.md, docs/04-ai-contract/05-auth-contract.md
- **PRD:** docs/01-prd/features/system.md, docs/01-prd/business-rules.md § 10
- **SAD:** docs/03-sad/21-module-system.md (Section 12.3 Roadmap (Phase 3 row: 'policy simulation'))
- **Design:** No page-level spec exists yet (documented gap in docs/02-design/pages/overview.md) — follow CLAUDE.md frontend rules until a design spec exists.

## Required Existing Code

task-018, task-203, task-013, task-014.

## Backend Scope

- Application layer: `SimulatePolicyUseCase` — accepts a hypothetical role/permission/branch-scope configuration plus a target action (e.g. `finance.journal.post` on branch X), and evaluates it against the same Authorization middleware logic (task-014) used at runtime, without applying any change.
- Presentation layer: route, controller for `POST /system/policy-simulations` (convention-derived).

## Frontend Scope

No dedicated page in this task; backend-only per Backend Scope. Any UI consuming this endpoint is scoped to a later frontend task once docs/02-design coverage exists.

## Database Impact

Read-only; does not persist a change.

## API Impact

Adds POST /system/policy-simulations.

## Workflow Impact

Lets an Administrator validate a high-risk configuration change (task-202/203's flow) before committing it, reducing accidental over- or under-provisioning.

## Security Impact

Simulation must reuse the exact same evaluation logic as task-014's live middleware (not a reimplementation) so its answer is provably accurate; gated to Security Admin/Owner.

## Testing Required

- Unit tests for the Use Case/Entity (per docs/05-testing/unit-tests.md).
- Integration test for Controller/Repository (per docs/05-testing/api-tests.md).

## Deliverables

- `SimulatePolicyUseCase`, route, controller, tests proving output matches task-014's live evaluation for the same inputs

## Acceptance Criteria

Per docs/01-prd/acceptance-criteria/system.md:

- Simulation output for a given hypothetical configuration matches what task-014's middleware would actually decide if that configuration were live.

## Definition of Done

Endpoint implemented and tested against the live-middleware-parity requirement. **Ambiguity flagged:** convention-derived endpoint; no literal Section 6 spec exists for this roadmap-maturity item. ABAC extensions and organisation-wide governance analytics (also named in Section 12.3's Phase 4 row) are not built by this task — they are noted as further Enterprise RBAC maturity beyond this Phase 5 task set's scope, since Section 12.3 gives no additional detail to implement them against.

---

## Dependency Detail

- **Blocked By:** task-018, task-203
- **Required Before:** See phase-5-plan.md Implementation Order.
- **Can Run In Parallel With:** Tasks in other Epics once own dependencies are satisfied.
