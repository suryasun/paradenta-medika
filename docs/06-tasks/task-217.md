# task-217: Branch Access Policy per Role (PATCH /system/roles/{roleId}/branch-policy)

**Phase:** Phase 4 - Multi Branch Platform
**Epic:** BC. Branch-Level Access Control
**Feature:** BC2. Policy Management
**Module:** System
**Priority:** P1 - High

---

## Business Goal

Implement `UpdateRoleBranchPolicyUseCase`, letting a Security Admin mark a role as cross-branch (bypasses task-215's guard) or single-branch (strictly scoped), completing the roadmap 'Branch-Level Access Control' capability.

## Depends On

- task-017 (Role List & Create)
- task-216 (Branch Scope Authorization Guard)

## Required Documents

- **AI Contract:** docs/04-ai-contract/07-module-contract.md, docs/04-ai-contract/04-api-contract.md, docs/04-ai-contract/06-database-contract.md, docs/04-ai-contract/09-security-contract.md, docs/04-ai-contract/05-auth-contract.md
- **PRD:** docs/01-prd/features/system.md, docs/01-prd/business-rules.md § 10
- **SAD:** docs/03-sad/21-module-system.md (Section 4.1 Actor Matrix, Section 3.5 User and RBAC Rules)
- **Design:** No page-level spec exists yet (documented gap in docs/02-design/pages/overview.md) — follow CLAUDE.md frontend rules until a design spec exists.

## Required Existing Code

task-017, task-216, task-013, task-014, task-006.

## Backend Scope

- Domain layer: extend the `Role` entity with an `isCrossBranch` flag.
- Presentation layer: route, controller for `PATCH /system/roles/{roleId}/branch-policy` (convention-derived path).
- Application layer: `UpdateRoleBranchPolicyUseCase`, gated to Security Admin, protected against modifying the built-in Owner/Administrator roles inconsistently with `SYS_ROLE_SYSTEM_PROTECTED`.

## Frontend Scope

No dedicated page in this task; backend-only per Backend Scope. Any UI consuming this endpoint is scoped to a later frontend task once docs/02-design coverage exists.

## Database Impact

Adds an isCrossBranch column to the roles table (or a system_roles extension table).

## API Impact

Adds PATCH /system/roles/{roleId}/branch-policy.

## Workflow Impact

Determines how task-215's guard treats each role at runtime.

## Security Impact

`SYS_ROLE_SYSTEM_PROTECTED` (403) for built-in roles. Audit Trail entry required.

## Testing Required

- Unit tests for the Use Case/Entity (per docs/05-testing/unit-tests.md).
- Integration test for Controller/Repository (per docs/05-testing/api-tests.md).

## Deliverables

- Role entity extension, migration
- `UpdateRoleBranchPolicyUseCase`, route, controller, tests

## Acceptance Criteria

Per docs/01-prd/acceptance-criteria/system.md:

- Built-in roles reject this change with `SYS_ROLE_SYSTEM_PROTECTED`.
- Flipping the flag is immediately reflected by task-215's guard on the next request (no stale cache).

## Definition of Done

Endpoint implemented and tested. **Ambiguity flagged:** convention-derived path, not literal in the SAD.

---

## Dependency Detail

- **Blocked By:** task-017, task-216
- **Required Before:** See phase-4-plan.md Implementation Order.
- **Can Run In Parallel With:** Tasks in other Epics once own dependencies are satisfied.
