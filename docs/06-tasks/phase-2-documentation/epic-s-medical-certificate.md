# Epic S: Medical Certificate — Documentation (task-088)

> Retroactive documentation, per the template in `phase-1-documentation/epic-j-foundational-infrastructure.md`'s header note.

---

## Documentation Reviewed

- `docs/06-tasks/task-088.md`
- `docs/03-sad/15-module-emr.md` Section 25 (Medical Certificate — 4 certificate types; 3 literal business rules: Doctor-only issuance, auto-generated number, stored as Attachment)

## Task List

| Task | Name |
|---|---|
| task-088 | Issue Medical Certificate, P2 |

## Implementation Plan

`IssueMedicalCertificateUseCase` generates a unique, auto-numbered certificate for one of the four documented types (Fit To Work / Sick Leave / Medical Statement / Dental Treatment Certificate) and stores the resulting document via Epic Q's Upload Attachment flow, in-process.

**Dual Doctor-only enforcement — a deliberate deviation from this phase's usual single-permission pattern.** Every other "(Doctor role)"-annotated task in this phase is enforced purely via RBAC (`requirePermission`, seeded to `DOCTOR` only). Task-088 is the sole exception: its own Testing Required section explicitly demands a use-case-level unit test ("only a Doctor-role user can issue a certificate"), which a pure permission-seeding assertion cannot satisfy at the use-case test layer (this codebase's tests are all use-case-level with fake repositories; no HTTP-layer RBAC integration tests exist anywhere). Resolved by adding a second, explicit check inside the use case: `doctorRepository.findByUserId(actorUserId)` must resolve to a real Doctor, or `OnlyDoctorCanIssueCertificateException` is thrown — in addition to, not instead of, the RBAC gate.

## Files Created

`apps/backend/src/modules/emr/`:
- `domain/repositories/IMedicalCertificateRepository.ts`
- `application/services/CertificateNumberGenerator.ts`
- `application/dtos/IssueMedicalCertificateRequestDto.ts`, `MedicalCertificateResponseDto.ts`
- `application/mappers/MedicalCertificateMapper.ts`
- `application/use-cases/IssueMedicalCertificateUseCase.ts` + `.test.ts`, `GetMedicalCertificateUseCase.ts`, `ListPatientMedicalCertificatesUseCase.ts`
- `infrastructure/repositories/MedicalCertificateRepository.ts`
- `presentation/controllers/MedicalCertificateController.ts`

Frontend: `features/emr/components/MedicalCertificateSection.tsx` + `.test.tsx`, `hooks/useMedicalCertificate.ts`.

## Files Modified

- `apps/backend/prisma/schema.prisma` (added `MedicalCertificateType` enum + `MedicalCertificate` model)
- `apps/backend/src/modules/emr/domain/exceptions/EmrExceptions.ts` (added `OnlyDoctorCanIssueCertificateException`, `MedicalCertificateNotFoundException`)
- `apps/backend/src/modules/emr/presentation/routes/emr.routes.ts` (wired `medicalCertificateController`)
- `apps/frontend/features/emr/components/VisitWorkspace.tsx` (added Medical Certificate tab)

## Database Changes

Migration `20260802124232_add_medical_certificate`: `medical_certificates` table.

## API Changes

| Endpoint | Permission |
|---|---|
| `POST /emr/visits/:id/medical-certificates` | `emr.certificate.issue` (DOCTOR role only, dual-enforced) |
| `GET /emr/medical-certificates/:id` | `emr.certificate.read` |
| `GET /patients/:patientId/medical-certificates` | `emr.certificate.read` |

## Frontend Changes

`MedicalCertificateSection` — type selection + free-text content, issuance list.

## Security Validation

Live-verified end-to-end (not just unit-tested): a `registration1` user's issuance attempt against a real Visit returned `403` in a manual smoke test; the same request as `doctor1` succeeded and produced a retrievable Attachment.

## Architecture Validation

- **Certificate number format** (`MC-YYYYMMDD-0001`) has no literal SAD specification (only "auto-generated" is stated); chose to mirror `ReservationNumberGenerator`'s already-established date-prefixed sequential-counter convention for codebase consistency rather than inventing an unrelated scheme.
- **`content` field** was added to the schema even though SAD Section 25 lists no fields beyond certificate type — justified as "a certificate needs some body text a Doctor authors," the same category of minimal, documented, non-invented addition as `Prescription.medicineName`.
- Reuses `UploadAttachmentUseCase` in-process, the same pattern established in Epic R.
