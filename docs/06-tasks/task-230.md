# task-230: Production Object Storage Configuration

**Phase:** Phase 4 - Multi Branch Platform
**Epic:** BI. Infrastructure Evolution
**Feature:** BI5. Object Storage
**Module:** Infrastructure
**Priority:** P1 - High

---

## Business Goal

Elevate Object Storage (already used by EMR Clinical Attachment in Phase 2) to a production-grade, multi-branch-shared configuration per docs/03-sad/24-deployment.md Section 7 Object Storage Architecture, the roadmap Phase 4 'Object Storage' infrastructure item — versioning, cross-region backup readiness, and access-key rotation.

## Depends On

- task-228 (Centralized Backup Strategy Implementation)

## Required Documents

- **AI Contract:** docs/04-ai-contract/01-global-rules.md, docs/04-ai-contract/02-architecture-contract.md, docs/04-ai-contract/09-security-contract.md
- **PRD:** docs/01-prd/vision.md, docs/01-prd/product-goals.md
- **SAD:** docs/03-sad/24-deployment.md (Section 7 Object Storage Architecture, Part 6 Section 8 Object Storage Configuration, Part 10 Section 4 Object Storage Backup) and docs/03-sad/21-module-system.md Section 5.4 (attachments: storage metadata, owner module/type/id, classification — object storage access authorised separately)
- **Design:** No page-level spec exists yet (documented gap in docs/02-design/pages/overview.md) — follow CLAUDE.md frontend rules until a design spec exists.

## Required Existing Code

task-228.

## Backend Scope

- Infrastructure as Code: production Object Storage bucket/container configuration with versioning enabled (per Part 10 Section 4's 'mendukung versioning' requirement), access-key rotation policy, and cross-region backup readiness.
- Confirm every module writing to Object Storage (EMR Attachments from Phase 2, Report exports from Phase 3 task-191) uses the shared, externally-configured bucket rather than a per-module hardcoded path — a consistency check, not new application logic.

## Frontend Scope

No dedicated page in this task; backend-only per Backend Scope. Any UI consuming this endpoint is scoped to a later frontend task once docs/02-design coverage exists.

## Database Impact

No schema change; metadata continues to live in the database per the existing 'metadata in DB, content in Object Storage' pattern (docs/03-sad/08-erd.md).

## API Impact

None (no new endpoint; existing Attachment and Report-export endpoints from Phase 2/3 are unaffected by this infrastructure change).

## Workflow Impact

Ensures every branch's clinical attachments and report exports share one durable, versioned, backed-up storage layer rather than diverging per deployment.

## Security Impact

Access keys rotated per policy; bucket access restricted per Section 8.3 Export Controls (Reporting) and the EMR Attachment module's 'URL Object Storage tidak boleh diakses langsung' rule (no direct public URL access).

## Testing Required

- Infrastructure validation: `terraform plan`/`docker compose config` dry-run, health-check smoke test, and a documented rollback drill per docs/03-sad/24-deployment.md Section 11.

## Deliverables

- Production Object Storage IaC configuration with versioning enabled
- Access-key rotation policy documented
- Consistency check confirming EMR Attachment (Phase 2) and Report export (Phase 3 task-191) both target the shared configuration

## Acceptance Criteria

Per docs/03-sad/24-deployment.md Section 7 (no dedicated PRD acceptance-criteria file exists for infrastructure):

- Versioning is enabled and verified (uploading a new version of the same key retains the prior version).
- No module accesses Object Storage via a direct public URL.

## Definition of Done

Object Storage configured for production, versioning verified, and the cross-module consistency check completed.

---

## Dependency Detail

- **Blocked By:** task-228
- **Required Before:** See phase-4-plan.md Implementation Order.
- **Can Run In Parallel With:** Tasks in other Epics once own dependencies are satisfied.
