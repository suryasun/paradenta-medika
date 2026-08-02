# task-016: User Detail, Update, Activate/Deactivate

**Phase:** Phase 1 - Foundation (MVP)  
**Epic:** B. User & Access Administration  
**Feature:** B1. User Management  
**Module:** System Administration  
**Priority:** P1 - High

---

## Business Goal

Allow an Administrator to view, edit, and activate/deactivate a specific user account, which is required to manage staff turnover (e.g. disabling an ex-employee's access).

## Depends On

- task-015

## Required Documents

- **AI Contract:** docs/04-ai-contract/07-module-contract.md
- **PRD:** docs/01-prd/features/system.md
- **SAD:** docs/03-sad/21-module-system.md Section 6.1 (GET/PATCH /system/users/{userId}, POST /system/users/{userId}/activate, POST /system/users/{userId}/deactivate)
- **Design:** No page-level spec exists yet (documented gap in docs/02-design/pages/overview.md).

## Required Existing Code

task-015 (User entity/list already exists).

## Backend Scope

- GET /system/users/{userId} (detail, permission system.user.read).
- PATCH /system/users/{userId} (update profile fields, permission system.user.manage).
- POST /system/users/{userId}/activate (permission system.user.activate).
- POST /system/users/{userId}/deactivate (permission system.user.deactivate) -- must also revoke active sessions per docs/03-sad/21-module-system.md 'session revocation' pattern used elsewhere for deactivation.

## Frontend Scope

- User Detail/Edit page with Activate/Deactivate action buttons, permission-guarded.

## Database Impact

- Reads/updates users row; deactivation may cascade to sessions revocation.

## API Impact

- Adds GET/PATCH /system/users/{userId}, POST .../activate, POST .../deactivate.

## Workflow Impact

Deactivating a user must immediately prevent further logins/API calls -- an already-issued access token should fail on next Authentication middleware check once session state reflects deactivation.

## Security Impact

- Deactivation must revoke all active sessions for that user, not just flip a flag (consistent with docs/04-ai-contract/05-auth-contract.md AUTH-054, which lists user suspension as a session-revocation trigger).

## Testing Required

- Unit test: deactivating a user revokes their active sessions.
- Integration test: a deactivated user's subsequent authenticated request is rejected.

## Deliverables

- Controllers, routes, Use Cases, DTOs, tests for all four endpoints.

## Acceptance Criteria

- Detail/update endpoints work and are permission-gated.
- Deactivate immediately revokes sessions; a follow-up request with the old token fails.
- Reactivating restores login capability.

## Definition of Done

- All four endpoints implemented, tested, permission-gated, audit-logged.

---

## Dependency Detail

- **Blocked By:** task-015.
- **Required Before:** None blocking other modules.
- **Can Run In Parallel With:** task-017, task-018.
