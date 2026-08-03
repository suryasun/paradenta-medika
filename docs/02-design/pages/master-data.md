# Pages: Master Data Module

> Status: **Proposed Design, verified against shipped code**. `docs/03-sad/11-module-master-data.md` has no UI Pages section (unlike Patient's §12) — this spec is derived from that document's Sections 3, 8, 9, 12–14, 18 (scope, catalog, roles, business rules, CRUD/soft-delete flow), `docs/01-prd/business-rules.md` §1, and `docs/06-tasks/task-015.md`–`task-026.md`. Master Data is Phase 1 (shipped): this pass also verifies every claim against the actual implementation at `apps/frontend/features/master-data/` and `apps/frontend/config/navigation.ts`, and flags where shipped code diverges from `docs/02-design/ui-guidelines.md`'s resolved rules — those divergences are real gaps, not proposals to relax the guideline.

---

## 1. Page Inventory

### 1.1 Shipped (Phase 1, task-015–026)

The SAD's Master Data Catalog (§8) lists 28 reference types across 4 groups (Clinical, Inventory, Financial, General — `docs/03-sad/11-module-master-data.md` §8.1–8.4). Phase 1 shipped **7 of the 28** — the subset the Phase 1 modules (Patient, Reservation, Queue, EMR Basic, Billing Basic) actually consume — plus one EMR-owned catalog that is UI-colocated under the same `/master-data` route group:

| Catalog | Route | SAD §8 group | Component | Service |
|---|---|---|---|---|
| Clinic | `/master-data/clinics` | Clinical | `ClinicsAdminPage` | `clinicService` |
| Branch | `/master-data/branches` | Clinical | `BranchesAdminPage` | `branchService` |
| Doctor | `/master-data/doctors` | Clinical | `DoctorsAdminPage` | `doctorService` |
| Treatment Category | `/master-data/treatment-categories` | Clinical | `TreatmentCategoriesAdminPage` | `treatmentCategoryService` |
| Treatment | `/master-data/treatments` | Clinical | `TreatmentsAdminPage` | `treatmentService` |
| Payment Method | `/master-data/payment-methods` | Financial | `PaymentMethodsAdminPage` | `paymentMethodService` |
| Tooth Condition | `/master-data/tooth-conditions` | Clinical | `ToothConditionsAdminPage` | `toothConditionService` |
| Consent Template *(EMR-owned, not a SAD §8 catalog)* | `/master-data/consent-templates` | — | `ConsentTemplatesAdminPage` | `consentTemplateService` |

**Gap flagged:** Consent Template is routed under `/master-data` for UI convenience but its permission prefix is `emr.consent-template.*` (task-085), not `masterdata.*` — it is domain-owned by EMR, not Master Data. This is a UI grouping decision, not a module-boundary violation (no cross-module DB access is implied), but it means "Master Data" as a sidebar section is a **UI grouping of admin/reference screens**, not a 1:1 mirror of the SAD's module boundary. Document this distinction wherever the sidebar section is discussed (see §6 Navigation).

### 1.2 Not yet built (remaining 21 catalogs)

Department, Room, Dental Chair, Employee, Specialty *(distinct from Doctor's free-text `specialization` field shipped in 1.1 — SAD §11.8 models Specialty as its own referenced catalog; the shipped Doctor form has not been reconciled to that yet)*, Medicine, Medical Item, Consumable, Supplier, Insurance, Bank, Tax, Discount, Promotion, Diagnosis Reference, Procedure Code, Unit, Currency, Nationality, Religion, Occupation, Education.

These are not scoped to any Phase 1 task (`docs/06-tasks/phase-1-plan.md` task-015–026 covers only the 7 in §1.1) and have no page spec yet. They become in-scope as their consuming module ships: Warehouse needs Medicine/Medical Item/Consumable/Supplier/Unit (Phase 3, shipped backend-only — see `docs/06-tasks/phase-3-plan.md`); Finance needs Bank/Tax (Phase 3); HR needs Employee/Department (Phase 3/5). **Defer their page specs to those modules' own design passes** rather than speccing them here disconnected from a consumer — noted as a gap, not guessed.

---

## 2. Layout Pattern (applies to all 8 shipped pages identically)

Every Master Data page is generated from one shared shell, `AdminEntityListPage<T>` (`apps/frontend/features/master-data/components/AdminEntityListPage.tsx`), parameterized per catalog by a `columns[]` + `fields[]` (`FieldConfig[]`, `apps/frontend/features/master-data/lib/fieldConfig.ts`) + `service` triple. There is no per-catalog custom layout — component tree:

```text
<AdminEntityListPage title columns fields service>
├── Header row
│   ├── H1: {title}                              (e.g. "Treatments")
│   └── PermissionGuard(`${permissionPrefix}.manage`)
│       └── Button "New {Title, singular}"        → opens Create modal
├── LoadingState | ErrorState | EmptyState | Table  (see §3, mutually exclusive)
├── Modal "New {Title}" (open when showCreate)
│   └── AdminEntityForm(fields, mode="create")
└── Modal "Edit {Title}" (open when editingItem set)
    └── AdminEntityForm(fields, mode="edit", initialValues=editingItem)
```

Table body per row: one `TableCell` per `columns[]` entry (either raw field value or a `render()` override — e.g. Treatment's Price column formats via `formatCurrency`), then a `Status` cell (Active/Inactive `Badge`, tone `success`/`neutral`), then an `Actions` cell with `Edit` / `Deactivate`|`Activate` text links, both gated by `PermissionGuard(`${permissionPrefix}.manage`)`.

No side panel, no footer/bulk actions, no dedicated Detail page — "view" is the row itself; "detail with usage/reference count before allowing edit of locked fields" (described as a proposed pattern in the pre-verification version of this doc) **was not built**. This is a real gap against SAD §13.4 ("Delete Validation... apakah data digunakan transaksi") and §12.5 (Transaction Dependency) — the shipped form has no client-side signal for *why* a `code` field is locked or *whether* deactivating will break an active transaction; that validation exists only server-side (`FIN_ACCOUNT_MAPPING_MISSING`-style 422s surface generically via `submitError`, not with a dedicated "used by N invoices" explanation). Flagged for a future task, not fabricated as already solved.

---

## 3. States (`ui-guidelines.md` §1 — verified against shipped code)

| State | Guideline requirement | Shipped (`AdminEntityListPage.tsx`) | Compliant? |
|---|---|---|---|
| Loading | Skeleton rows matching real row height/columns | `LoadingState`: full-height centered spinner + "Loading {title}..." text, no skeleton rows | **Gap** — spinner-only overlay, contradicts §1 explicitly |
| Empty | Single-sentence message + primary create action | `EmptyState title="No {title} found"` — no `description`, no `action` prop passed despite the component supporting both | **Gap** — no create action offered from the empty state; user must already know to use the header's "New" button |
| Error | `Alert`-style with retry, no raw stack trace | `ErrorState`: role="alert" box with `getApiErrorMessage(error)` + "Try again" button calling `refetch()` | **Compliant** |

These three gaps are cross-cutting — `AdminEntityListPage` is reused by all 8 catalogs, so fixing it once fixes all 8 pages. Recorded here rather than silently treated as resolved; a follow-up frontend task should retrofit `LoadingState` to accept a `rows`/`columns` skeleton mode and wire `EmptyState`'s `action` prop to the same "New" trigger the header uses.

---

## 4. Forms (`ui-guidelines.md` §2 — verified against shipped code)

`AdminEntityForm` (`apps/frontend/features/master-data/components/AdminEntityForm.tsx`) renders one control per `FieldConfig`: `text` → `Input`, `number` → `Input type=number`, `date` → `Input type=date`, `boolean` → native checkbox, `select` → `Select`. `createOnly` fields (e.g. `clinicCode`, `branchCode` — SAD §12.1 "Code tidak boleh diubah setelah data digunakan transaksi") are filtered out of the edit-mode field list, matching the business rule.

| Guideline requirement | Shipped | Compliant? |
|---|---|---|
| Inline validation on blur | HTML `required` attribute only (native browser validation on submit); no blur handlers, no inline error text under fields | **Gap** — validation is submit-time and browser-native, not the specified blur pattern |
| Multi-step forms for complex entries | N/A for these 8 catalogs (all ≤ 10 fields, single modal) — correctly *not* using a Stepper, per §2's own "never a single 20-field form" is not triggered here | Compliant (not applicable) |
| Destructive-action confirm modal + typed reason | Deactivate is a plain text-link mutation, no confirm modal | **Gap** — `ui-guidelines.md` §2 requires this for financially/operationally irreversible actions; Deactivate is reversible (Activate exists), so this may be an intentional exception rather than a bug — flagged, not silently fixed either way; needs an explicit decision. |
| Money fields right-aligned, 2-decimal, `Rp`-prefixed, format on blur | Treatment's `defaultPrice` / `doctorFee` are plain `<Input type="number">`, left-aligned, unformatted | **Gap** — same pattern as the table-column formatting: the table cell formats via `formatCurrency`, but the form input for the same field doesn't |

### 4.1 Field list per catalog (as shipped)

| Catalog | Field (label) | Type | Required | Create-only | Notes |
|---|---|---|---|---|---|
| Clinic | Clinic Code | text | ✔ | ✔ | SAD §11.1 "Clinic Code harus unik" |
| | Clinic Name | text | ✔ | | |
| | Legal Name | text | ✔ | | |
| | Tax Number (NPWP) | text | ✔ | | |
| | Owner Name | text | | | |
| | Phone | text | ✔ | | |
| | Email | text | ✔ | | |
| | Address | text | ✔ | | SAD models as Text; shipped as single-line Input — acceptable simplification for v1 |
| Branch | Clinic | select (Clinic) | ✔ | ✔ | |
| | Branch Code | text | ✔ | ✔ | |
| | Branch Name | text | ✔ | | |
| | Phone | text | ✔ | | |
| | Email | text | ✔ | | |
| | Address | text | ✔ | | |
| | Timezone | text | | | SAD §11.2 lists Time Zone as a Main Attribute |
| Doctor | User Account | select (System User) | ✔ | ✔ | Doctor wraps an existing System User 1:1 (task-023 code comment) — not a bare profile as SAD §11.6 implies; System User creation happens under System > Users first |
| | Branch | select (Branch) | ✔ | | SAD §11.6: "Dapat bekerja pada lebih dari satu Branch" — shipped form is single-branch only, gap against multi-branch business rule |
| | Doctor Code | text | ✔ | ✔ | |
| | Full Name | text | ✔ | | |
| | Specialization | text (free text) | | | SAD §11.8 models Specialty as its own catalog (§1.2 gap above) |
| | SIP Number | text | | | |
| | STR Number | text | | | |
| | Consultation Fee | number | | | Not formatted as money (see gap table above) |
| | Phone | text | | | |
| | Email | text | | | |
| Treatment Category | Category Code | text | ✔ | ✔ | |
| | Category Name | text | ✔ | | |
| Treatment | Treatment Code | text | ✔ | ✔ | |
| | Treatment Name | text | ✔ | | |
| | Category | select (Treatment Category) | ✔ | | |
| | Duration (minutes) | number | | | |
| | Default Price | number | ✔ | | Not money-formatted in the form (table column is) |
| | Doctor Fee | number | | | SAD §13.3 "Doctor Fee tidak boleh melebihi harga treatment" — **not validated client-side**, server-only |
| Payment Method | Method Code | text | ✔ | ✔ | |
| | Method Name | text | ✔ | | |
| | Is Cash | boolean | | | |
| Tooth Condition | Condition Code | text | ✔ | ✔ | |
| | Condition Name | text | ✔ | | |
| | Category | select (8 fixed options: Healthy/Disease/Restoration/Prosthodontic/Endodontic/Surgical/Orthodontic/Implantology) | ✔ | | |
| | Color | text (hex) | | | Consumed as the Odontogram legend color (task-069) |
| Consent Template *(EMR-owned)* | Category | select (General/Clinical/Surgical) | ✔ | | |
| | Title | text | ✔ | | |
| | Body | text | ✔ | | SAD/PRD model this as long-form template text; shipped as single-line Input — likely needs a textarea, flagged |

---

## 5. Table/List Behavior (`ui-guidelines.md` §3 — verified against shipped code)

| Guideline requirement | Shipped | Compliant? |
|---|---|---|
| Search | None | **Gap** |
| At least one filter (branch/date/status) | None — not even the Active/Inactive filter this doc's earlier draft assumed | **Gap** |
| Sort on sortable columns | None — `service.list()` is called with no params, table renders API order as-is | **Gap** |
| Pagination | `service.list()` supports `{ items: T[] }` shape only in the shared type; no page/limit params wired, no `Pagination` component rendered | **Gap** |
| Row actions: icon buttons w/ tooltip, overflow past 3 | Text links ("Edit", "Deactivate"/"Activate") — 2 actions today so overflow isn't triggered, but they're plain links, not icon buttons | **Partial gap** — under the 3-action overflow threshold, but wrong control type |
| Status as colored pill, mapped per design-system.md §8 | `Badge tone={isActive ? "success" : "neutral"}` — this **is** correct: Active/Inactive is not one of the domain statuses enumerated in `design-system.md` §8 (Reservation/Queue/Invoice/Warehouse), so success/neutral for a generic active toggle is a reasonable default, not an invented status color | Compliant |

This is the largest gap cluster in the module: **every one of the 8 shipped list pages is missing search, filter, sort, and pagination**, which `ui-guidelines.md` §3 marks mandatory for every data table. Given catalogs like Treatments or Doctors can realistically grow past what fits on one unpaginated page, this should be prioritized as a near-term frontend fix — but implementing it is out of scope for a design-doc pass; recorded here as the concrete punch list for that future task.

---

## 6. RBAC (SAD §9, cross-referenced to shipped permission strings and `navigation.md` §2)

| Role | Read | Create/Update | Deactivate | Import/Export |
|---|---|---|---|---|
| Owner | ✔ | ✖ | ✖ | Export only |
| Clinic Manager | ✔ | ✔ | ✔ (implied by Update) | ✔ |
| Administrator | ✔ | ✔ | ✔ | ✔ |
| Doctor | ✔ (read only) | ✖ | ✖ | ✖ |
| Registration Staff | ✔ (read only) | ✖ | ✖ | ✖ |
| Cashier | ✔ (read only) | ✖ | ✖ | ✖ |
| Warehouse Staff | Inventory catalogs only | ✖ | ✖ | ✖ |
| Finance Staff | Financial catalogs only | ✖ | ✖ | ✖ |

Source: `docs/03-sad/11-module-master-data.md` §9. **Gap flagged:** Import/Export is not implemented in any shipped page (`AdminEntityListPage` has no import/export affordance at all — SAD §19 describes Excel/CSV import and Excel/CSV/PDF export as in-scope capabilities); the §9 Import/Export columns above describe the *intended* permission grants, not a built feature.

**Shipped enforcement pattern** (`Sidebar.tsx`, `PermissionGuard.tsx`, `apps/frontend/config/navigation.ts`):
- Sidebar section and each catalog's sub-link are **hidden** (not disabled) when the viewing user lacks `masterdata.<catalog>.read` (or `emr.consent-template.read` for Consent Templates) — e.g. `masterdata.clinic.read`, `masterdata.branch.read`, `masterdata.doctor.read`, `masterdata.treatment-category.read`, `masterdata.treatment.read`, `masterdata.payment-method.read`, `masterdata.tooth-condition.read`.
- Within a page, "New"/"Edit"/"Deactivate" are hidden (not disabled) via `PermissionGuard` gated on `masterdata.<catalog>.manage`.
- Per `ui-guidelines.md` §5, hidden-not-disabled is the correct choice here since a read-only role (Doctor, Registration Staff, Cashier) has the entire *write* surface of Master Data out of scope, not one workflow-relevant action they need to see-but-not-use.
- Server-side enforcement is independent (footer disclaimer text in `Sidebar.tsx`: "Menu tampil sesuai role (RBAC) — visibilitas UI saja; otorisasi sebenarnya di server").

---

## 7. Navigation

**Entry points:** Sidebar "Master Data" section (all 8 catalogs as flat sub-links, no further grouping — see §1's note that this doesn't match the SAD §8's 4-group taxonomy; it's flat because only 7 of 28 catalogs are built, not enough yet to warrant sub-grouping). Cross-module entry: Doctor's "User Account" select links out to System > Users (`/system/users`) if the needed account doesn't exist yet — no in-place create-user shortcut exists (gap).

**Exit points:** None — Master Data pages are leaf pages; catalog values are *consumed* by other modules' dropdowns (Reservation's Doctor picker, Billing's Payment Method picker, EMR's Treatment/Tooth Condition pickers) but there is no "used by" cross-link from a Master Data row back to where it's used.

**`navigation.md` §4 correction:** that section's Master Data tree (`Data Klinik & Cabang / Departemen & Ruangan / Dokter & Pegawai / Treatment & Treatment Category / Medicine...`) is a **proposed, pre-verification grouping that does not match what shipped**. The actual sidebar (`apps/frontend/config/navigation.ts`) is a flat 8-item list: Clinics, Branches, Doctors, Treatment Categories, Treatments, Payment Methods, Tooth Conditions, Consent Templates. `navigation.md` should be updated to mark Master Data confirmed against this real structure rather than the proposed grouping — done in this pass (see the corresponding edit to `navigation.md` §4).

## 9. Interactivity (2026 refresh — `design-system.md` §11, `ui-guidelines.md` §9)

Master Data's 8 catalogs are this app's clearest **inline-edit** candidate (`ui-guidelines.md` §9.3): every field except the create-locked Code is a single value with no cross-field validation — exactly the "single-field, low-risk correction" case inline edit is for. Concretely: Branch Name, Phone, Email, Timezone, Treatment's Duration/Default Price/Doctor Fee, Payment Method's "Is Cash" toggle — all currently require opening the full Edit modal (§2) for a one-field change; add a hover/focus edit-pencil per eligible cell that commits on blur/Enter. The existing Deactivate/Activate text link (§2) is already effectively inline-edit for the boolean Active field — extend that same interaction model to the other simple fields rather than inventing a new pattern. Multi-field or create-only-field changes (Code, Category assignment) stay in the modal — this doesn't replace §2's Create/Edit pattern, it narrows when the modal is necessary. Micro-interaction: the Deactivate/Activate toggle should get a brief success-tone border flash (`design-system.md` §11.7) on completion, replacing the current silent table refresh with no confirmation cue beyond the Badge changing.
