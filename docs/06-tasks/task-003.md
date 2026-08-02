# task-003: Initial Database Schema Migration (Phase 1 Entities)

**Phase:** Phase 1 - Foundation (MVP)  
**Epic:** J. Foundational Infrastructure  
**Feature:** J1. Database & Environment Setup  
**Module:** Cross-Cutting / Database  
**Priority:** P0 - Blocking (must complete first)

---

## Business Goal

Establish the physical database schema for every entity Phase 1 depends on, so that all subsequent module tasks have a concrete table to persist against. Without this, no other Phase 1 task can be implemented.

## Depends On

- None (can start once foundational infrastructure tasks are complete)

## Required Documents

- **AI Contract:** docs/04-ai-contract/06-database-contract.md
- **PRD:** docs/01-prd/business-rules.md (all Phase 1 module sections)
- **SAD:** docs/03-sad/06-database-design.md, docs/03-sad/07-data-dictionary.md, docs/03-sad/08-erd.md
- **Design:** N/A (backend/database task, no UI)

## Required Existing Code

None. This is the first implementation task.

## Backend Scope

- Create Prisma schema (or equivalent migration DDL) for: users, roles, permissions, role_permissions, user_roles, sessions, refresh_tokens (Authentication/System)
- Tables: clinics, branches, doctors, treatment_categories, treatments, payment_methods (Master Data)
- Tables: patients (Patient)
- Tables: reservations (Reservation)
- Tables: queues (Queue)
- Tables: visits (EMR basic -- Visit is the EMR aggregate root per docs/03-sad/15-module-emr.md Section 15)
- Tables: invoices, payments (Billing basic)
- Every table must include audit columns (created_at, updated_at, created_by, updated_by) and soft-delete column (deleted_at) per docs/04-ai-contract/06-database-contract.md Soft Delete Policy
- Foreign keys must be defined per the Module Dependency Matrix in docs/03-sad/02-system-architecture.md Section 11.2 (e.g. Reservation -> Patient, Queue -> Reservation, Visit -> Queue+Patient+Doctor, Invoice -> Visit, Payment -> Invoice)

## Frontend Scope

- None -- this is a backend/database-only task.

## Database Impact

- New migration creating all Phase 1 tables listed above.
- Indexes on all foreign keys and on fields used for search/filter (patient name/identity, reservation date/status, queue status, invoice status) per docs/03-sad/02-system-architecture.md Section 26.5 (Database Principle: Index Strategy).

## API Impact

- None directly -- this task has no HTTP endpoint of its own.

## Workflow Impact

Enables every downstream Phase 1 workflow (Patient -> Reservation -> Queue -> EMR -> Billing) by providing the persistence layer each depends on.

## Security Impact

- Passwords/credentials must never be stored in plaintext -- the users table must only store a password hash column (docs/04-ai-contract/05-auth-contract.md AUTH-064, AUTH-066).
- No sensitive data (password hash) should be selectable by default in any generated Prisma client query used elsewhere.

## Testing Required

- Migration must run cleanly against a fresh MySQL instance (up) and be reversible (down) if the tooling supports it.
- Schema validation test asserting every Phase 1 entity table exists with the expected columns and foreign keys.

## Deliverables

- prisma/schema.prisma (or SQL migration files) covering all tables listed in Backend Scope.
- Migration successfully applied to a local/dev database.

## Acceptance Criteria

- All tables listed in Backend Scope exist with correct columns, types, and foreign keys matching docs/03-sad/06-database-design.md and docs/03-sad/07-data-dictionary.md.
- Every table has created_at, updated_at, deleted_at (soft delete) and, where the entity is written by an authenticated user, created_by/updated_by.
- Migration is idempotent and does not error on repeated `prisma migrate deploy` in a clean environment.

## Definition of Done

- Migration file(s) committed.
- Migration applies successfully in CI/local environment.
- No SAD-documented field for a Phase 1 entity is missing from the schema.

---

## Dependency Detail

- **Blocked By:** None.
- **Required Before:** Every other Phase 1 task (all depend on the schema existing).
- **Can Run In Parallel With:** task-004 (Environment Configuration) can be done in parallel by a different engineer; task-005 (App Scaffold) should wait until this is at least drafted.
