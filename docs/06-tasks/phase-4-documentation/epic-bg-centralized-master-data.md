# Epic BG: Centralized Master Data — Documentation (task-221–223)

---

## Documentation Reviewed

- `docs/06-tasks/task-221.md`, `task-222.md`, `task-223.md`
- `docs/03-sad/11-module-master-data.md` Section 5.1 Centralized Reference Data, Section 5.2 Standardization, Section 8 Master Data Catalog, Section 10.2 CRUD Workflow, Section 10.3 Cross Module Usage, Section 5.5 Data Integrity
- `phase-4-plan.md` Ambiguity #3 (no literal Master Data API spec, unlike Warehouse/Finance)

## Task List

| Task | Name |
|---|---|
| task-221 | Master Data Template (Entity & Migration) |
| task-222 | Push Master Data Template to Branches (`POST /masterdata/templates/{templateId}/push`) |
| task-223 | Master Data Consistency Report (`GET /masterdata/templates/{templateId}/drift`) |

## Implementation Plan

Two new tables: `MasterDataTemplate` (`entityType`, `templatePayload: Json`, `version`, `ownerClinicId` — `version` auto-increments whenever `templatePayload` changes, satisfying task-221's own AC that a template can evolve without breaking branches already synced to a prior version) and `MasterDataTemplateBranchLink` (`templateId`, `branchId`, `pushedVersion`, `snapshotPayload`, `currentPayload` — one row per template-branch pair actually pushed).

`PushMasterDataTemplateUseCase` per requested branch: creates the link if absent; updates it (overwriting both `snapshotPayload` and `currentPayload`) if the branch hasn't diverged (`currentPayload === snapshotPayload`); flags `CONFLICT` and leaves it untouched if it has diverged — one conflicting branch never blocks the push to the other requested branches. `GetMasterDataDriftReportUseCase` field-by-field diffs `snapshotPayload` vs. `currentPayload` per branch, plus an `isStale` flag when the template's version has advanced since that branch's last push.

**Important documented limitation** (not silently glossed over): this 16-task pass builds no branch-side endpoint that actually mutates `currentPayload` independently of a push. Divergence is therefore only produced by a future task wiring a real branch-scoped entity's own update flow to keep `currentPayload` in sync — the conflict-detection *logic* is fully built and unit-tested (via a test-only `simulateLocalEdit` helper on the Fake repository), but the real-world *trigger* for it doesn't exist yet in this codebase. See `phase-4-implementation-report.md` Section 5 #2.

## Files Created

- `apps/backend/src/modules/master-data/domain/repositories/IMasterDataTemplateRepository.ts`, `IMasterDataTemplateBranchLinkRepository.ts`
- `apps/backend/src/modules/master-data/infrastructure/repositories/MasterDataTemplateRepository.ts`, `MasterDataTemplateBranchLinkRepository.ts`
- `apps/backend/src/modules/master-data/application/dtos/MasterDataTemplateRequestDto.ts`
- `apps/backend/src/modules/master-data/application/use-cases/PushMasterDataTemplateUseCase.ts` + `.test.ts`
- `apps/backend/src/modules/master-data/application/use-cases/GetMasterDataDriftReportUseCase.ts` + `.test.ts`
- `apps/backend/src/modules/master-data/application/use-cases/MasterDataTemplate.test.ts` (versioning behavior, exercised through the shared `buildCrudUseCases` factory)
- `apps/backend/src/modules/master-data/presentation/controllers/MasterDataTemplateController.ts`
- `apps/backend/prisma/migrations/20260804040755_phase4_master_data_templates/`

## Files Modified

- `apps/backend/prisma/schema.prisma` (`MasterDataTemplate`, `MasterDataTemplateBranchLink` models; `masterDataTemplates`/`masterDataTemplateLinks` relations on `Clinic`/`Branch`)
- `apps/backend/src/modules/master-data/domain/exceptions/MasterDataExceptions.ts` (no new exception ended up needed for push conflicts — reported as a per-branch `status: 'CONFLICT'` field instead of a thrown exception, since one conflicting branch must not abort the others)
- `apps/backend/src/modules/master-data/presentation/routes/master-data.routes.ts` (5 new routes, reusing the existing `buildCrudUseCases`/`buildCrudController` factory for the base CRUD + a dedicated controller for push/drift)
- `apps/backend/prisma/seed.ts` (`masterdata.template.manage`, `masterdata.template.read`)
- `apps/backend/tests/fakes/masterDataFakes.ts` (`FakeMasterDataTemplateRepository`, `FakeMasterDataTemplateBranchLinkRepository`)

## Database Changes

`masterdata_templates` and `masterdata_template_branch_links` tables (both new).

## API Changes

| Endpoint | Permission |
|---|---|
| `GET`/`POST /masterdata/templates` | `masterdata.template.read` / `.manage` |
| `GET`/`PUT /masterdata/templates/{templateId}` | `masterdata.template.read` / `.manage` |
| `POST /masterdata/templates/{templateId}/push` | `masterdata.template.manage` |
| `GET /masterdata/templates/{templateId}/drift` | `masterdata.template.manage` |

## Frontend Changes

None — backend-only.

## Security Validation

- Push and drift are both gated by the write-level `masterdata.template.manage` permission (not split read/write), matching task-222/223's own Security Impact wording ("Gated by masterdata-template-manage permission" for both).
- Audit Trail entry recorded for every push, listing every branch affected and its resulting status — satisfies task-222's "Audit Trail entry required listing every branch affected."

## Architecture Validation

- Reused the existing `buildCrudUseCases`/`buildCrudController` factory for the base Template CRUD (create/list/get/update) rather than hand-writing four more near-identical use cases — the same factory every other Master Data entity uses since Phase 1.
- The push/drift use cases are entity-agnostic: `entityType` is a free-form string, and neither use case ever writes to a real Treatment/TreatmentCategory/etc. table directly — the new `MasterDataTemplateBranchLink` table is the only write surface, exactly as scoped in the approved implementation plan, avoiding invented per-entityType mapping logic for entities whose branch-scoping this phase never confirmed.
