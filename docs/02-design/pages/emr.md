# Pages: EMR Module

> Status: **Verified against shipped code, summary depth** (Phase 1+2 combined, task-048–094 — the shipped module makes no Basic/Full split, see §1). `docs/03-sad/15-module-emr.md` is by far the largest module document in the project (~11,800 lines across 6 embedded parts: EMR Core, Digital Odontogram, Periodontal/Clinical Examination, Attachment/Storage, Clinical Timeline, Integration/CDSS/AI, Infrastructure). Going to full `patient.md`-depth (complete field lists, every validation rule) for all 14 clinical sections in one pass would require reading and cross-referencing all 6 parts in full — **explicitly out of scope for this pass**, consistent with this file's own pre-existing flag that Odontogram alone "is the one EMR screen worth a dedicated high-fidelity mockup pass." This revision verifies the page inventory, workspace layout, RBAC, states, and navigation against shipped code (`apps/frontend/features/emr/`), and gives each of the 14 clinical sections an accurate one-line summary — but defers exhaustive per-section field/validation specs (Odontogram, Periodontal, Prescription, etc.) to their own future passes, same as the CDSS/AI/Integration/Infrastructure parts of the SAD (Phase 5–6 scope, not yet relevant).

---

## 1. Page Inventory

There is exactly **one EMR route**: `/emr/visits/{id}` (Visit Workspace). Unlike every other module covered so far, EMR has no list page, no standalone sidebar entry, and no separate pages per clinical function — all 14 clinical sections (§3) are tabs within one workspace, and the workspace itself is reachable only from Queue (`queue.md` §7: "Open Visit" button on a `CALLED` entry — confirmed via `navigation.ts`'s own code comment: "no standalone EMR sidebar entry: apps/backend has no Visit List endpoint").

| Page | Route | Purpose |
|---|---|---|
| Visit Workspace | `/emr/visits/{id}` | The entire EMR module — patient header, clinical alert banner, 14-tab clinical record |

**Gap flagged against the pre-verification draft:** it listed Odontogram, SOAP Note, Treatment Plan, Prescription, Clinical Attachment, Clinical Timeline, Medical Certificate, and Referral as separate "pages." None are separate routes — they're tabs (except Clinical Timeline, which isn't in the Visit Workspace at all; see §4). This single-workspace design is a reasonable clinical-UX choice (a chairside doctor stays on one URL for the whole visit) but means "page inventory" for EMR is really "tab inventory" — documented as such below rather than forcing a page-per-concept structure that was never built.

---

## 2. Visit Workspace Layout

```text
Visit Workspace (/emr/visits/{id})
├── Header: H1 "Visit {visitNo}" + status Badge (see §5) + chief complaint
├── PermissionGuard(emr.visit.close) → "Close Visit" button (danger), shown only while open (see §5)
├── ClinicalAlertBanner (patientId) — see §3, row 0
└── Tabs (14 — see §3)
```

`readOnly` is a single derived boolean (`!OPEN_VISIT_STATUSES.includes(visit.status)`) passed down to every tab — once a visit leaves its open statuses, every section's write affordances (forms, record buttons) disappear at once, not per-tab. This is a clean, consistent way to enforce SAD's various "cannot be modified once closed" rules (e.g. §28's Odontogram versioning immutability) without repeating the check in each of the 14 components.

**Gap flagged against the pre-verification draft:** it assumed a patient header (name/MRN/age/allergy flag) and a right-rail Clinical Timeline alongside the tabs. Neither exists — the header shows only Visit Number/status/chief complaint (not patient name/MRN/age inline; presumably available via the Queue card that linked here, but not repeated on this page), and there is no timeline rail (see §4).

---

## 3. Clinical Sections (tabs, in shipped order)

| Tab | Component | One-line summary of what's shipped | Notable gap |
|---|---|---|---|
| *(banner, not a tab)* | `ClinicalAlertBanner` | Patient-level alert banner (allergies etc.) shown above all tabs | Not read in this pass — flagged for the future field-level pass |
| Vital Signs | `VitalSignSection` | Record/view vitals for this visit | — |
| SOAP Note | `SoapNoteSection` | Subjective/Objective/Assessment/Plan (SAD §16) | — |
| Diagnosis | `DiagnosisSection` | Record diagnoses (SAD §21) | — |
| Treatment | `TreatmentSection` | Procedure/material entries actually performed (SAD §23 Procedure Management) | — |
| Medical History | `MedicalHistorySection` | Patient-level (not visit-level) history — reads `patientId`, not `visitId` | — |
| Allergy | `AllergySection` | Patient-level allergy record | — |
| **Odontogram** | `OdontogramSection` | **Table + form, not the interactive tooth-chart SVG.** Lists current per-tooth/surface conditions (Tooth/Surface/Condition/History columns), a record-condition form (Tooth number select, Surface free-text, Condition select from Master Data's Tooth Condition catalog — `master-data.md` §4.1), and a per-tooth history modal. The code's own comment (task-068) explicitly flags the full SVG "Tooth SVG, Surface Overlay, Context Menu" interaction (SAD §31 Interactive Odontogram) as deferred to its own follow-up UI task if the interaction complexity exceeds one session — **it did, and that follow-up hasn't happened yet.** This confirms and sharpens the pre-existing "dedicated hi-fi pass" flag: the functional API surface (record/current-state/history) is done; the visual chart is not. | Deferred (tracked, not silently missing) |
| Treatment Plan | `TreatmentPlanSection` | Planned procedures + cost estimate (SAD §22) | — |
| Periodontal | `PeriodontalAssessmentSection` | Periodontal chart entry (SAD Part 3, §5–6) | Full chart depth deferred, same as Odontogram |
| Referral | `ReferralSection` | Refer to another specialist/provider (SAD §26) | — |
| Follow Up | `FollowUpSection` | Follow-up scheduling note (SAD §26) | — |
| Attachments | `AttachmentSection` | Clinical file/X-ray upload (SAD Part 4) | — |
| Prescription | `PrescriptionSection` | Medicine/dosage entry, presumably printable (SAD §24; `patient.md`-style print flow not verified this pass) | — |
| Consent | `ConsentSection` | Consent form capture, uses Master Data's Consent Template catalog (`master-data.md` §1.1 — EMR-owned) | — |
| Medical Certificate | `MedicalCertificateSection` | Sick/health certificate issuance (SAD §25) | — |

Every section receives `readOnly` from the workspace (see §2) — none manage their own open/closed logic independently, a good consistency property worth preserving in any future section additions.

---

## 4. Clinical Timeline — lives in Patient, not EMR

`ClinicalTimelineSection` exists as a component but is rendered from `PatientDetailView` (Patient module), not from `VisitWorkspace`. This matches `patient.md` §12.2's tab list, which already documents a Patient Detail tab covering treatment/visit history — Clinical Timeline is that tab's implementation, cross-module by design (a patient's timeline spans many visits, so it belongs on the patient record, not inside any single visit's workspace). The pre-verification draft's assumption of an in-workspace timeline rail was incorrect; corrected here.

---

## 5. Visit Status (workspace header Badge)

| Status | Token | `readOnly`? |
|---|---|---|
| `DRAFT` | Neutral | No (open) |
| `WAITING_EXAMINATION` | Info | No (open) |
| `IN_PROGRESS` | Warning | No (open) |
| `COMPLETED` | Success | Yes (closed) |
| `LOCKED` | Success | Yes (closed) |
| `ARCHIVED` | Neutral | Yes (closed) |

This is a 6-status set not previously documented anywhere in `docs/02-design` — added here, using only existing tokens (no new hues needed, unlike Odontogram's per-condition colors in §6). `COMPLETED` and `LOCKED` sharing Success is analogous to Queue's `CANCELLED`/`NO_SHOW` sharing Error (`design-system.md` §8.2) — distinguished by label text only.

---

## 6. Odontogram color standard — intentionally NOT a fixed design-system.md token set

SAD §27 (Clinical Color Standard) lists 10 literal tooth-condition colors (Healthy=Green, Caries=Red, Filled=Blue, Temporary Filling=Yellow, RCT=Purple, Crown=Gold, Implant=Silver, Extraction=Gray, Fracture=Orange, Mobility=Brown) — far more hues than this design system's fixed semantic palette (`design-system.md` §2: Primary/Secondary/Success/Warning/Error/Info only). **This is not a gap requiring a design-system.md extension**, because SAD §27 itself specifies these colors are configurable, not fixed ("Warna dapat dikustomisasi melalui Master Configuration") — and the shipped implementation already reflects that: Master Data's Tooth Condition catalog (`master-data.md` §4.1) has its own free-text `Color` (hex) field per condition, set per-clinic rather than hardcoded. Odontogram color is deliberately outside the semantic status-pill system (§8) because it's clinical/configurable data, not a UI-state token — document this distinction explicitly so a future pass doesn't mistakenly try to force tooth colors into the Primary/Secondary/Success/Warning/Error/Info palette.

SAD §27's own "UI Rules" also mandate: "Warna tidak boleh digunakan sebagai satu-satunya indikator; ikon dan tooltip tetap ditampilkan" (color must never be the sole indicator — icon and tooltip must still be shown). The current table-based `OdontogramSection` satisfies this trivially (condition is a text column, not a color swatch) — but this requirement becomes binding again once the deferred interactive SVG chart (§3) is eventually built, and should be carried into that future spec explicitly.

---

## 7. RBAC (SAD §9, cross-checked against shipped permission strings)

| Role | View | Create | Update | Delete | Close Visit |
|---|:---:|:---:|:---:|:---:|:---:|
| Owner | ✔ | ✖ | ✖ | ✖ | ✖ |
| Clinic Manager | ✔ | ✖ | ✖ | ✖ | ✖ |
| Administrator | ✔ | ✖ | ✖ | ✖ | ✖ |
| Doctor | ✔ | ✔ | ✔ | ✖ | ✔ |
| Nurse | ✔ | ✔* | ✔* | ✖ | ✖ |
| Registration Staff | View Limited | ✖ | ✖ | ✖ | ✖ |
| Cashier | View Summary | ✖ | ✖ | ✖ | ✖ |

\* Per SAD §9's own note: Nurse write access is scoped to Vital Sign, medical-material usage, and nursing notes only — Diagnosis, SOAP Assessment, and Close Visit are Doctor-only. **Gap flagged:** this per-field nurse restriction is a business rule the shipped `readOnly` boolean (§2) cannot express — `readOnly` is all-or-nothing per visit status, not per-section-per-role. Today, if a Nurse has any EMR write permission at all, `PermissionGuard` calls at each section presumably gate on section-specific permission strings (e.g. presumably `emr.vital-sign.record` vs `emr.diagnosis.record`) rather than the coarse `readOnly` flag alone — this needs verification against each section's actual `PermissionGuard` calls in a future pass to confirm Nurse truly cannot reach Diagnosis/SOAP/Close Visit through the UI; not confirmed either way in this pass, flagged rather than assumed compliant.

**View Limited / View Summary** (Registration Staff, Cashier) are not implemented as distinct reduced views anywhere found in this pass — `VisitWorkspace` renders the same 14 tabs regardless of role, relying entirely on section-level `PermissionGuard`s to hide write actions. Whether Registration Staff and Cashier actually see a *reduced* read surface (not just a non-writable one) is unconfirmed — flagged as an open question, not asserted either way.

---

## 8. States (`ui-guidelines.md` §1)

| State | Shipped | Compliant? |
|---|---|---|
| Loading | `LoadingState` spinner (workspace-level) — same cross-cutting gap as every other module covered so far | Gap |
| Empty | Section-level (e.g. Odontogram's `EmptyState title="No tooth conditions recorded yet"`) — no description/action, consistent with the pattern (gap) seen elsewhere | Gap |
| Error | `ErrorState` + retry at workspace level | Compliant |

---

## 9. Navigation

**Entry point:** exclusively Queue's "Open Visit" action (`queue.md` §7) — there is no other way to reach a Visit Workspace in the shipped app. This is a significant, deliberate constraint (not an oversight — confirmed by the nav config's own code comment) worth stating plainly: **a doctor cannot browse to "my patients today" or search for a past visit directly** — every visit is reached by first finding its Queue ticket. Past/closed visits' continued reachability at `/emr/visits/{id}` (e.g. via a direct link from Clinical Timeline) is plausible but not confirmed in this pass.

**Exit point:** "Close Visit" (Doctor only) — per SAD §10.1's high-level workflow, closing should lead toward "Generate Billing," but no explicit post-close navigation (e.g. a link to create the invoice) was found in `VisitWorkspace.tsx` in this pass; flagged as an open question consistent with the same gap already flagged in `queue.md` §7 for the Queue→Billing handoff.

`navigation.md` §4's existing EMR tree (Visit / Odontogram / SOAP Note / Treatment Plan & Procedure / Prescription / Clinical Attachment / X-Ray / Clinical Timeline) should be corrected to reflect that these are tabs of one workspace, not sidebar items — done as part of this pass (see the corresponding edit).

## 10. Interactivity (2026 refresh — `design-system.md` §11, `ui-guidelines.md` §9)

**The interactive odontogram is this whole design system's signature element** — full specification lives in `design-system.md` §11.5 (FDI-numbered SVG arc, per-tooth click/keyboard focus, Master-Data-driven per-condition color with a mandatory icon+tooltip pairing per SAD §27's own UI Rules, side-panel tooth history, drag-to-select for multi-tooth conditions). This page spec's job is just to place it correctly: it replaces §3's current table+form Odontogram tab entirely, not alongside it — the table view was always a stand-in (task-068's own code comment), not a permanent second option. Building it is the single highest-value item in this whole 2026 interactivity revision, precisely because it's the one place this system was told to spend its aesthetic risk.

Elsewhere in the Workspace: Tab switching (§2, 14 tabs) uses `motion-standard` content cross-fade, not an instant swap, so a doctor moving quickly between SOAP/Diagnosis/Treatment doesn't lose visual continuity. Vital Signs and Prescription entry are candidates for **inline edit** on already-recorded values (a mistyped blood pressure reading), same pattern as `master-data.md` §9 and `patient.md` §13, though — unlike those two — every EMR field write is presumably subject to stricter validation (clinical data), so confirm this against `docs/03-sad/15-module-emr.md`'s validation rules per-field before assuming inline edit is safe for a given field, rather than blanket-applying it. `ClinicalAlertBanner` (§3, not a tab) is the one place **live update** matters beyond the odontogram/Queue board — a new allergy or drug-interaction alert recorded mid-visit should surface immediately without a page reload, since it's a safety-relevant signal.
