# task-015: User List & Create (GET/POST /system/users)

**Phase:** Phase 1 - Foundation (MVP)  
**Epic:** B. User & Access Administration  
**Feature:** B1. User Management  
**Module:** System Administration  
**Priority:** P0 - Blocking

---

## Business Goal

Allow an Administrator to view all system users and create new ones, which is the prerequisite for every other role (Doctor, Nurse, Cashier, etc.) being able to log in at all.

## Depends On

- task-013
- task-014
- task-006

## Required Documents

- **AI Contract:** docs/04-ai-contract/07-module-contract.md
- **PRD:** docs/01-prd/features/system.md
- **SAD:** docs/03-sad/21-module-system.md Section 6.1 (User and Access Administration)
- **Design:** docs/02-design/navigation.md Section 2 (System Administration sidebar entry) -- no page-level spec exists yet (documented gap).

## Required Existing Code

task-003 (users table), task-013, task-014 (auth/authz middleware), task-006 (audit).

## Backend Scope

- GET /system/users (list, paginated, permission system.user.read) per docs/03-sad/21-module-system.md Section 6.1.
- POST /system/users (create, permission system.user.manage).
- CreateUserUseCase: hash initial password per Auth policy (task-010's password rules apply), assign default role if provided.
- ListUsersUseCase with pagination/filtering per the standard list-endpoint contract in docs/04-ai-contract/04-api-contract.md.

## Frontend Scope

- User List page (table with search/filter/pagination) and Create User form -- following docs/02-design/ui-guidelines.md Loading/Empty/Error state requirements.

## Database Impact

- Reads/writes users table.

## API Impact

- Adds GET /system/users, POST /system/users.

## Workflow Impact

Prerequisite for all role-based workflows -- no other role can exist until an Administrator can create users.

## Security Impact

- Requires system.user.read / system.user.manage permission (task-014 enforcement).
- Created user's password must follow the same policy as task-010.

## Testing Required

- Unit test: CreateUserUseCase enforces password policy and uniqueness of username/email.
- Integration test: GET /system/users returns paginated results; POST /system/users creates a user visible in the list.

## Deliverables

- Controllers, routes, Use Cases, DTOs for both endpoints, tests.

## Acceptance Criteria

- A user without system.user.manage cannot create a user (403).
- A created user can subsequently log in via task-007 with the credentials provided.
- List endpoint supports pagination per the API Contract.

## Definition of Done

- Both endpoints implemented, tested, permission-gated, audit-logged.

---

## Dependency Detail

- **Blocked By:** task-013, task-014, task-006.
- **Required Before:** Any task that needs a non-seed user to exist (effectively all role-specific workflows in manual/QA testing).
- **Can Run In Parallel With:** task-017 (Roles) can be developed in parallel; task-016 depends on this one existing.
