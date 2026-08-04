# task-285: Regional Address Master Data (Province / Regency / District / Village)

**Phase:** Patient Module Enhancement (post-roadmap addendum)
**Epic:** PE. Patient Module Enhancement
**Feature:** PE2. Regional Address Catalog
**Module:** Master Data
**Priority:** P1 - High

---

## Business Goal

Create a full 4-level Indonesian administrative-region catalog (Province → Regency/City → District → Village, each FK'd to its parent) as new Master Data entities, so `patient_addresses` (task-286) can store real, structured region references instead of free text — the prerequisite catalog for a proper multi-address feature.

## Depends On

- task-013 (Authentication Middleware)
- task-014 (Authorization Middleware)
- task-006 (Audit Trail Service)

## Required Documents

- **AI Contract:** `docs/04-ai-contract/06-database-contract.md`, `docs/04-ai-contract/07-module-contract.md`
- **PRD:** `docs/01-prd/features/master-data.md`
- **SAD:** `docs/03-sad/11-module-master-data.md` §8.5 (Regional Master Data), §11.21–11.24 (Province/Regency/District/Village entities), §12.4 (Branch Scope — region data is Global), §20.1/§30.1 (ER diagram, table list)
- **Design:** No page-level spec exists yet (documented gap in `docs/02-design/pages/overview.md`) — follow `CLAUDE.md` frontend rules until a design spec exists. Given the volume of data (34 provinces / 500+ regencies / 7,000+ districts / 80,000+ villages), the admin UI is a low priority relative to the seed data itself; a simple read-only browsable list (no create/update UI needed at launch) is sufficient.

## Required Existing Code

Existing Master Data CRUD pattern (any catalog module, e.g. Treatment Category) as the template for repository/use-case/controller shape.

## Backend Scope

- Four new Prisma models: `Province`, `Regency` (FK `provinceId`), `District` (FK `regencyId`), `Village` (FK `districtId`, optional `postalCode`).
- Standard `List`/`Get` use cases per level, each filterable by parent id (e.g. `GET /master-data/regencies?provinceId=...`) so the frontend can drive cascading selects.
- **No Create/Update/Delete use cases at launch** — this is seeded reference data (see Database Impact), not an admin-editable catalog in the initial release. If clinic operations later need to correct/add an entry, that is new scope for a future task, not silently assumed here.
- Seed data source is **not specified in this documentation pass** — implementation must source an accurate, current Kemendagri/BPS regional-code dataset (the standard reference used by virtually every Indonesian address system) before writing the seed script; this is flagged explicitly rather than guessed, per `CLAUDE.md`'s escalation rule.

## Frontend Scope

No dedicated admin page in this task — these are lookup catalogs consumed via cascading dropdowns wherever an address is entered (task-286's Patient Address tab is the first consumer). No standalone Master Data list page needed at launch, per Backend Scope's read-only decision above.

## Database Impact

Creates `provinces`, `regencies`, `districts`, `villages` tables (see `docs/03-sad/07-data-dictionary.md` §10.21–10.24 for full column definitions). Est. row counts: ~34 / ~514 / ~7,200 / ~83,900 respectively (Indonesia's actual 2024 administrative counts) — implementation should batch-insert via seed script, not one-row-at-a-time API calls.

## API Impact

Adds `GET /master-data/provinces`, `GET /master-data/regencies?provinceId=`, `GET /master-data/districts?regencyId=`, `GET /master-data/villages?districtId=`.

## Workflow Impact

Unblocks task-286 (Patient Address Book), which is the first and only consumer at launch.

## Security Impact

Gated by `masterdata.region.read` (new permission, read-only — no `.manage` permission exists at launch since there is no write endpoint). Reused by every future module that needs a structured address.

## Testing Required

- Unit tests for each `List` use case, filtered by parent id.
- Integration test confirming the 4-level FK chain rejects an orphaned child (e.g. a `districtId` query for a `regencyId` that doesn't belong to the given province is simply an empty result, not an error — parent filtering is a convenience, not a strict validation gate at the read layer).

## Deliverables

- 4 Prisma models + migration + seed script (seed data source to be confirmed at implementation time, see Backend Scope)
- 4 `List` use cases + repositories + controller + routes
- Unit tests

## Acceptance Criteria

Per `docs/01-prd/business-rules.md` §1 (Master Data, "New this pass"):

- Every level (Province/Regency/District/Village) is FK'd to its parent; no level accepts a free-text value anywhere in the system.
- A Regency query filtered by an invalid/nonexistent `provinceId` returns an empty list, not a 500 error.

## Definition of Done

Migration applied, 4 catalogs seeded with real Indonesian administrative data, List endpoints implemented and tested, `masterdata.region.read` permission seeded.

---

## Dependency Detail

- **Blocked By:** task-013, task-014, task-006
- **Required Before:** task-286 (Patient Address Book)
- **Can Run In Parallel With:** task-284, task-287, task-288, task-289
