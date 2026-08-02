# Epic R: Consent Management — Documentation (task-085–087)

> Retroactive documentation, per the template in `phase-1-documentation/epic-j-foundational-infrastructure.md`'s header note.

---

## Documentation Reviewed

- `docs/06-tasks/task-085.md`–`task-087.md`
- `docs/03-sad/15-module-emr.md` Part 3.3D (Digital Consent — Sections 40 "Supported Signature Types"/"Guardian Support", 48 "immutability after signing") and Section 42 ("PDF Generation" — explicitly out of scope)
- `docs/06-tasks/phase-2-plan.md` Ambiguity #7: whether Treatment recording (Phase 1 task-053) should be hard-blocked without a signed Consent

## Task List

| Task | Name |
|---|---|
| task-085 | Consent Category Reference Data, P1 |
| task-086 | Create & Sign Consent, P0 — Blocking |
| task-087 | Get Consent / Consent History, P1 |

## Implementation Plan

`ConsentTemplate` is a simple code/category/title/body catalog, built via the existing generic `crudUseCaseFactory`/`crudControllerFactory` (already established in Phase 1, reused rather than duplicated). `Consent` is instantiated from a template for a specific Visit/procedure, then signed once (immutable afterward — `ConsentAlreadySignedException` on any re-sign attempt).

**Ambiguity #7 resolved via `AskUserQuestion`: "No hard gate" (the recommended option) was selected** — recording a Treatment (Phase 1 task-053) is **not** technically blocked by the absence of a signed Consent. No enforcement code was added anywhere in `RecordTreatmentUseCase`.

**PDF generation gap:** Section 42 explicitly marks PDF Generation out of scope, so the "signed document" stored as an Attachment is a minimal plain-text rendering of the consent (title/body/signer/hash), not a real PDF — documented inline on `SignConsentUseCase`, following the same "reasonable minimal, not invented business logic" judgment-call pattern used elsewhere in this phase.

## Files Created

`apps/backend/src/modules/emr/`:
- `domain/repositories/IConsentTemplateRepository.ts`, `IConsentRepository.ts`
- `application/dtos/ConsentTemplateRequestDto.ts`, `CreateConsentRequestDto.ts`, `SignConsentRequestDto.ts`, `ConsentResponseDto.ts`
- `application/mappers/ConsentMapper.ts`
- `application/use-cases/CreateConsentUseCase.ts` + `.test.ts`, `SignConsentUseCase.ts` + `.test.ts`, `GetConsentUseCase.ts`, `ListPatientConsentsUseCase.ts` + `.test.ts`
- `infrastructure/repositories/ConsentTemplateRepository.ts`, `ConsentRepository.ts`
- `presentation/controllers/ConsentController.ts`

Frontend: `features/master-data/components/ConsentTemplatesAdminPage.tsx`, `hooks/useConsentTemplates.ts`, `services/consentTemplate.service.ts`; `features/emr/components/ConsentSection.tsx` + `.test.tsx` (a plain `<canvas>` + pointer-event signature pad, `toDataURL()` capture — no new library added).

## Files Modified

- `apps/backend/prisma/schema.prisma` (added `ConsentCategory`/`ConsentSignerRelationship` enums + `ConsentTemplate`, `Consent` models)
- `apps/backend/src/modules/emr/domain/exceptions/EmrExceptions.ts` (added `ConsentNotFoundException`, `ConsentAlreadySignedException`, `ConsentTemplateNotActiveException`)
- `apps/backend/src/modules/emr/presentation/routes/emr.routes.ts` (wired `consentTemplateController`, `consentController`; reused `UploadAttachmentUseCase` and `uploadAttachmentUseCase` instance in `SignConsentUseCase`)
- `apps/frontend/features/emr/components/VisitWorkspace.tsx` (added Consent tab)

## Database Changes

Migration `20260802103213_add_consent_management`: `consent_templates`, `consents` tables.

## API Changes

| Endpoint | Permission |
|---|---|
| `GET /consent-templates` | `emr.consent-template.read` |
| `POST /consent-templates` | `emr.consent-template.manage` |
| `GET /consent-templates/:id` | `emr.consent-template.read` |
| `PUT /consent-templates/:id` | `emr.consent-template.manage` |
| `POST /emr/consents` | `emr.consent.create` |
| `POST /emr/consents/:id/sign` | `emr.consent.sign` |
| `GET /emr/consents/:id` | `emr.consent.read` |
| `GET /patients/:patientId/consents` | `emr.consent.read` |

## Frontend Changes

`ConsentSection` — template selection + procedure entry to create a consent, and a canvas signature-pad modal to sign it. jsdom canvas APIs are stubbed in the component test (`HTMLCanvasElement.prototype.getContext`/`toDataURL`), since jsdom doesn't implement real canvas rendering.

## Security Validation

- `ConsentAlreadySignedException` is the hard immutability gate — no update path exists on a signed consent anywhere in the API surface.
- A SHA-256 hash of `consentId | signatureData | signedAt` is stored alongside the signed document, giving a tamper-evidence check without a full PKI signature (Section 40 lists PKI as one of several supported signature types, not a mandate).

## Architecture Validation

- `SignConsentUseCase` composes `UploadAttachmentUseCase` in-process (constructor injection) — the same reuse pattern established for Epic M's Reservation conversion, applied here to Attachment storage instead.
- The PDF stand-in decision is recorded as a doc-comment on `SignConsentUseCase` itself. The "No Hard Gate" decision is **not** marked anywhere in `RecordTreatmentUseCase` (there is nothing to comment on — no check was added, so no code references consent at all) and is recorded only here and in the original `AskUserQuestion` exchange; a future reader auditing `RecordTreatmentUseCase` in isolation would not discover this was a deliberate decision rather than an oversight. Flagged here as a documentation gap worth closing with an explicit doc-comment if this behavior is revisited.
