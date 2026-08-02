# task-232: Delegated & Time-Bound Access Grant

**Phase:** Phase 5 - Enterprise Platform
**Epic:** CB. Enterprise RBAC
**Feature:** CB1. Delegated Access
**Module:** System
**Priority:** P1 - High

---

## Business Goal

Implement `GrantDelegatedAccessUseCase`, realizing docs/03-sad/21-module-system.md Section 12.3's Phase 3 roadmap enhancement 'Delegated/time-bound access' — letting a user temporarily grant a subset of their own permission/branch scope to another user for a bounded period (e.g. covering an absence), without a permanent role change.

## Depends On

- task-017 (Role List & Create)
- task-210 (Assign Branch to User)
- task-013 (Authentication Middleware)
- task-014 (Authorization Middleware)
- task-006 (Audit Trail Service)

## Required Documents

- **AI Contract:** docs/04-ai-contract/07-module-contract.md, docs/04-ai-contract/04-api-contract.md, docs/04-ai-contract/06-database-contract.md, docs/04-ai-contract/09-security-contract.md, docs/04-ai-contract/05-auth-contract.md
- **PRD:** docs/01-prd/features/system.md, docs/01-prd/business-rules.md § 10
- **SAD:** docs/03-sad/21-module-system.md (Section 12.3 Roadmap (Phase 3 row: 'Delegated/time-bound access'), Section 3.5 User and RBAC Rules)
- **Design:** No page-level spec exists yet (documented gap in docs/02-design/pages/overview.md) — follow CLAUDE.md frontend rules until a design spec exists.

## Required Existing Code

task-017, task-210, task-013, task-014, task-006.

## Backend Scope

- Domain layer: `DelegatedAccessGrant` entity (grantorUserId, granteeUserId, permissionSubset, branchScope, effectiveFrom, effectiveUntil, status).
- Infrastructure layer: Prisma migration for `system_delegated_access_grants`.
- Application layer: `GrantDelegatedAccessUseCase` — a grantor can only delegate a subset of permissions/branches they themselves hold (no privilege escalation); the grant auto-expires at `effectiveUntil` without requiring a manual revoke.
- Presentation layer: route, controller for `POST /system/delegated-access-grants` (convention-derived path; not a literal endpoint in Section 6's table, since Enterprise RBAC is only named as a Phase 3/4 roadmap row in Section 12.3, not a Section 6 API spec).

## Frontend Scope

No dedicated page in this task; backend-only per Backend Scope. Any UI consuming this endpoint is scoped to a later frontend task once docs/02-design coverage exists.

## Database Impact

Creates system_delegated_access_grants table.

## API Impact

Adds POST /system/delegated-access-grants.

## Workflow Impact

Realizes the 'Enterprise RBAC' roadmap capability's delegated-access sub-feature.

## Security Impact

Grantor cannot delegate a permission/branch they don't themselves hold (enforced at grant time, not just at use time). Audit Trail entry required. Grant auto-expires; task-014's Authorization middleware must check `effectiveUntil` on every request, not just at grant creation.

## Testing Required

- Unit tests for the Use Case/Entity (per docs/05-testing/unit-tests.md).
- Integration test for Controller/Repository (per docs/05-testing/api-tests.md).

## Deliverables

- `DelegatedAccessGrant` entity, migration, repository
- `GrantDelegatedAccessUseCase`, route, controller, tests
- Authorization middleware extension to honor active, non-expired delegated grants

## Acceptance Criteria

Per docs/01-prd/acceptance-criteria/system.md:

- A grant attempting to delegate a permission the grantor doesn't hold is rejected.
- A request made after `effectiveUntil` is rejected as if the grant never existed.

## Definition of Done

Entity, migration, endpoint, and middleware extension implemented and tested. **Ambiguity flagged:** convention-derived endpoint path; Section 12.3 names this capability only as a roadmap-maturity row, not a literal API spec.

---

## Dependency Detail

- **Blocked By:** task-017, task-210
- **Required Before:** See phase-5-plan.md Implementation Order.
- **Can Run In Parallel With:** Tasks in other Epics once own dependencies are satisfied.
