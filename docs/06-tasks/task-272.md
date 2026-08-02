# task-272: Public API Documentation Portal

**Phase:** Phase 6 - Healthcare Ecosystem
**Epic:** DI. Public API
**Feature:** DI2. Documentation
**Module:** System
**Priority:** P3 - Low

---

## Business Goal

Publish an OpenAPI 3.1 documentation portal for the Public API surface defined in task-296, referencing the 'OpenAPI 3.1' generation already named as a deliverable pattern across multiple module SADs (Billing, EMR), extending that existing per-module documentation practice into one external-facing portal.

## Depends On

- task-271 (Public API Gateway Enablement)

## Required Documents

- **AI Contract:** docs/04-ai-contract/07-module-contract.md, docs/04-ai-contract/04-api-contract.md, docs/04-ai-contract/06-database-contract.md, docs/04-ai-contract/09-security-contract.md, docs/04-ai-contract/05-auth-contract.md
- **PRD:** docs/01-prd/features/system.md, docs/01-prd/business-rules.md § 10
- **SAD:** docs/03-sad/16-module-billing.md (Section 1 API Overview and Section 3219 Summary reference to OpenAPI 3.1 as the documentation format already used across module API specs)
- **Design:** No page-level spec exists yet (documented gap in docs/02-design/pages/overview.md) — follow CLAUDE.md frontend rules until a design spec exists.

## Required Existing Code

task-271.

## Backend Scope

- Infrastructure layer: aggregate the OpenAPI 3.1 specification fragments already produced per-module (per each module SAD's own stated documentation practice) into one published, browsable portal scoped to exactly the endpoint subset task-296 explicitly documented as Public-API-exposed — internal-only endpoints are excluded from this published spec even if they exist in the codebase.

## Frontend Scope

No dedicated page in this task; backend-only per Backend Scope. Any UI consuming this endpoint is scoped to a later frontend task once docs/02-design coverage exists.

## Database Impact

None.

## API Impact

Adds a documentation portal (e.g. GET /docs/public-api, serving static/generated OpenAPI content) — not a business endpoint.

## Workflow Impact

Gives external integrators self-service discovery of the Public API surface without requiring direct engineering support.

## Security Impact

The published spec must not leak internal-only endpoint paths or schemas beyond what task-296 scoped as public.

## Testing Required

- Verification that the published spec matches the documented public-endpoint scope exactly (automated diff check recommended).

## Deliverables

- Published OpenAPI 3.1 portal scoped to the documented Public API subset

## Acceptance Criteria

Per docs/01-prd/acceptance-criteria/system.md:

- The portal exposes exactly the endpoint subset task-296 documented as public — no more, no less.

## Definition of Done

Portal published and verified against task-296's documented scope.

---

## Dependency Detail

- **Blocked By:** task-271
- **Required Before:** See phase-6-plan.md Implementation Order.
- **Can Run In Parallel With:** Tasks in other Epics once own dependencies are satisfied.
