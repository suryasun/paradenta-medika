# task-228: Centralized Backup Strategy Implementation

**Phase:** Phase 4 - Multi Branch Platform
**Epic:** BI. Infrastructure Evolution
**Feature:** BI3. Centralized Backup
**Module:** Infrastructure
**Priority:** P0 - Blocking

---

## Business Goal

Implement the Centralized Backup strategy per docs/03-sad/24-deployment.md Part 10 (Backup Strategy, Database Backup, Object Storage Backup, RTO, RPO), the roadmap Phase 4 'Centralized Backup' infrastructure item, consolidating what would otherwise be ad hoc per-branch backup responsibility.

## Depends On

- task-226 (Dedicated Database Server Provisioning)

## Required Documents

- **AI Contract:** docs/04-ai-contract/01-global-rules.md, docs/04-ai-contract/02-architecture-contract.md, docs/04-ai-contract/09-security-contract.md
- **PRD:** docs/01-prd/vision.md, docs/01-prd/product-goals.md
- **SAD:** docs/03-sad/24-deployment.md (Part 10 Backup and Disaster Recovery, Section 6 Recovery Time Objective (RTO), Section 7 Recovery Point Objective (RPO), Section 4 Object Storage Backup)
- **Design:** No page-level spec exists yet (documented gap in docs/02-design/pages/overview.md) — follow CLAUDE.md frontend rules until a design spec exists.

## Required Existing Code

task-226.

## Backend Scope

- Infrastructure as Code: scheduled database backup job (targeting the dedicated database server from task-225) and a scheduled Object Storage backup job (covering EMR attachments per docs/03-sad/15-module-emr.md's Object Storage usage), both meeting the RTO/RPO targets defined in Part 10 Sections 6–7.
- Backup verification and a documented restore procedure/runbook.

## Frontend Scope

No dedicated page in this task; backend-only per Backend Scope. Any UI consuming this endpoint is scoped to a later frontend task once docs/02-design coverage exists.

## Database Impact

No schema change; adds a scheduled backup process against the existing schema.

## API Impact

None.

## Workflow Impact

Realizes Section 11's Disaster Recovery checklist item 'Scheduled Database Backup' and 'Backup Verification'.

## Security Impact

Backups must be encrypted at rest and access-restricted per docs/03-sad/24-deployment.md's production security requirements.

## Testing Required

- Infrastructure validation: `terraform plan`/`docker compose config` dry-run, health-check smoke test, and a documented rollback drill per docs/03-sad/24-deployment.md Section 11.

## Deliverables

- Scheduled database and object-storage backup jobs
- Backup verification job
- Restore runbook, dry-run tested

## Acceptance Criteria

Per docs/03-sad/24-deployment.md Part 10 (no dedicated PRD acceptance-criteria file exists for infrastructure):

- A backup completes and is verified (checksum/restore test) within the documented RTO/RPO targets.
- A documented restore drill successfully restores from the latest backup.

## Definition of Done

Backup jobs implemented, verified, and a restore drill successfully completed and documented.

---

## Dependency Detail

- **Blocked By:** task-226
- **Required Before:** See phase-4-plan.md Implementation Order.
- **Can Run In Parallel With:** Tasks in other Epics once own dependencies are satisfied.
