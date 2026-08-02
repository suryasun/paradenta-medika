# task-020: Revoke User Sessions (POST /system/users/{userId}/revoke-sessions)

**Phase:** Phase 1 - Foundation (MVP)  
**Epic:** B. User & Access Administration  
**Feature:** B2. Role & Permission Management  
**Module:** System Administration  
**Priority:** P2 - Medium

---

## Business Goal

Allow an Administrator to forcibly log a user out of all devices, e.g. after a suspected credential compromise.

## Depends On

- task-015

## Required Documents

- **AI Contract:** docs/04-ai-contract/05-auth-contract.md (AUTH-049)
- **PRD:** docs/01-prd/features/system.md
- **SAD:** docs/03-sad/21-module-system.md Section 6.1 (POST /system/users/{userId}/revoke-sessions, permission system.user.session.revoke); docs/03-sad/10-authentication.md Section 16 (administrator force logout)
- **Design:** No page-level spec exists yet (documented gap).

## Required Existing Code

task-015, task-013 (session model).

## Backend Scope

- RevokeUserSessionsUseCase supporting revoking all devices, a selected device, or all sessions per AUTH-049.
- POST /system/users/{userId}/revoke-sessions controller + DTOs.

## Frontend Scope

- 'Revoke Sessions' action on the User Detail page.

## Database Impact

- Updates sessions (revoked_at) for the target user.

## API Impact

- Adds POST /system/users/{userId}/revoke-sessions.

## Workflow Impact

Security incident-response workflow.

## Security Impact

- Gated by system.user.session.revoke.
- Must be recorded in the Audit Trail (administrative action on another user's account).

## Testing Required

- Unit test: revoking all sessions invalidates every active session for that user.
- Integration test: a subsequent request using a revoked session's token fails.

## Deliverables

- Controller, route, Use Case, DTOs, tests.

## Acceptance Criteria

- Targeted session(s) are revoked and subsequently unusable.
- Audit Trail entry recorded.

## Definition of Done

- Implemented and tested.

---

## Dependency Detail

- **Blocked By:** task-015.
- **Required Before:** None blocking.
- **Can Run In Parallel With:** task-018, task-019.
