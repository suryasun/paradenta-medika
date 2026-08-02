# Epic G: EMR Basic — Documentation (task-048–053)

> Retroactive documentation, per the template in `epic-j-foundational-infrastructure.md`'s header note.

---

## Documentation Reviewed

- `docs/06-tasks/task-048.md`–`task-053.md`
- `docs/03-sad/15-module-emr.md` Sections 14–17, 21 (Visit Management, SOAP, Vital Sign, Diagnosis taxonomy), Section 26 references
- `docs/03-sad/06-database-design.md` Section 43 (`diagnoses` table free-text variant, used to resolve the Diagnosis Reference master-data gap — Ambiguity #3 in `phase-1-plan.md`)

## Task List

| Task | Name |
|---|---|
| task-048 | Open Visit (EMR-001) |
| task-049 | Record Vital Sign (EMR-002) |
| task-050 | Record SOAP Note (EMR-003) |
| task-051 | Record Diagnosis (EMR-007) |
| task-052 | Close Visit (EMR-015) |
| task-053 | Record Treatment Entry (basic, EMR-008/009 combined) |

## Implementation Plan

Visit lifecycle: opened only from a `CALLED` Queue entry (one Visit per Queue), accepts Vital Sign/SOAP/Diagnosis/Treatment entries while open, and closes only once minimum documentation (a complete SOAP note + at least one Treatment entry) is met — at which point it transitions to `COMPLETED` and publishes `EMRFinished` for Billing to consume. Treatment price is snapshotted into `VisitTreatment.unitPrice/subtotal` at record time so later catalog price changes never retroactively alter historical visits. Diagnosis uses free-text fields + a `DiagnosisType` enum rather than an FK to a nonexistent coded catalog (Ambiguity #3).

## Files Created

`apps/backend/src/modules/emr/`: `application/{dtos,mappers,services,use-cases}/*`, `domain/{events,exceptions,repositories}/*`, `infrastructure/repositories/*`, `presentation/{controllers,routes}/*`.

## Files Modified

`apps/backend/src/app.ts` (mounted `buildEmrModule`, passed the shared `eventBus`).

## Database Changes

None beyond Epic J's initial migration (`Visit`, `VitalSign`, `SoapNote`, `VisitDiagnosis`, `VisitTreatment` already scaffolded there).

## API Changes

| Endpoint | Permission |
|---|---|
| `POST /emr/visits` | `emr.visit.create` |
| `GET /emr/visits/:id` | `emr.visit.read` |
| `POST /emr/visits/:id/vital-signs` | `emr.vital.record` |
| `PUT /emr/visits/:id/soap-note` | `emr.soap.record` |
| `POST /emr/visits/:id/diagnoses` | `emr.diagnosis.record` |
| `POST /emr/visits/:id/treatments` | `emr.treatment.record` |
| `POST /emr/visits/:id/close` | `emr.visit.close` |

## Frontend Changes

None. This is the largest documented frontend gap in Phase 1 — SOAP notes, diagnosis entry, and treatment recording all need real clinical-workflow UI/UX, none of which is specified anywhere in `docs/02-design/`.

## Security Validation

- `VisitNotOpenException` blocks every clinical-documentation write once a Visit is `COMPLETED`/`LOCKED`/`ARCHIVED`.
- `TreatmentNotActiveException` blocks recording against a deactivated Treatment catalog item (task-025 dependency).
- `MinimumDocumentationException` is the hard gate on Close Visit — cannot be bypassed by the API, only satisfied.

## Architecture Validation

- `RecordDiagnosisRequestDto`'s nested `diagnoses[]` array is validated with plain `@IsArray()`/`@ArrayMinSize(1)` plus manual per-entry checks in the use case, **not** `@ValidateNested()`/`@Type()` — those require the `reflect-metadata` polyfill, which was deliberately not added as a new dependency (self-caught `TypeError: Reflect.getMetadata is not a function` during testing; fixed without introducing an unapproved library).
- `CloseVisitUseCase` publishes `EMRFinished` via `IEventBus` — the exact seam `GenerateInvoiceUseCase` (Epic H) subscribes to; verified end-to-end by `tests/integration/emrFinishedToInvoice.test.ts`.
