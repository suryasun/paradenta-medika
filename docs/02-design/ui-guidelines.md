# UI Guidelines — Parakita Medika

> Status: **resolved**. Replaces the earlier gap report. The binding constraints listed there (Loading/Empty/Error states, RBAC-aware UI, no client-side-only enforcement, responsive layout) are restated below with concrete patterns, per `docs/02-design/design-system.md` and the module PRDs in `docs/01-prd/`.

## 1. Page states (mandatory on every list/detail page)

- **Loading** — skeleton rows matching the real row height/columns (not a spinner-only overlay) for tables; a skeleton card grid for dashboards.
- **Empty** — an icon-free, single-sentence message + the primary create action (e.g. "Belum ada pasien terdaftar — Registrasi pasien pertama"). Never show an empty table with just column headers.
- **Error** — the `Alert` component (severity=error) with a retry action; never a raw stack trace or blank page.

## 2. Forms

- Inline validation on blur, not only on submit. Error text sits directly under the field in `--color-error-error-700` (light) / `-300` (dark), 12px.
- Multi-step forms (patient registration, PO approval, payroll run) use the Horizontal/Vertical Stepper — never a single 20-field form.
- Destructive or financially irreversible actions (Void Invoice, Delete Master Data, Terminate Employee, Reopen Closed Period) always confirm via a modal dialog that restates the consequence in one sentence and requires a typed reason where the business rule mandates one (Void, Refund, Adjustment, Period Reopen — see `docs/01-prd/business-rules.md`).
- Money fields are always right-aligned, 2-decimal, `Rp` prefixed, and never accept free-typed thousand separators — format on blur.

## 3. Tables

- Every data table has: search, at least one filter (branch/date/status as relevant), sort on sortable columns, and pagination (never infinite scroll for financial/clinical records — page numbers are auditable).
- Row actions are icon buttons with a tooltip, collapsed into an overflow menu past 3 actions.
- Status is always a colored pill (see design-system.md §8), never a plain text cell.

## 4. Modals vs. full page

- Modal: quick, single-entity actions with ≤ 6 fields (cancel reservation, add discount, quick edit).
- Full page: anything with a stepper, a tab set, or that benefits from a URL (Patient Detail, Payroll Run, Stock Opname).

## 5. RBAC in the UI

Per `docs/02-design/navigation.md` and `docs/03-sad/21-module-system.md`: **menu and action visibility is convenience only** — hide/disable what the current user's role/permission does not allow, but every server call is independently authorized. Concretely:

- Sidebar sections render only for roles mapped in `navigation.md` §2.
- A disabled (not hidden) action — e.g. a Kasir seeing a greyed "Post Journal" button — is preferable to hiding it when the user needs to understand the workflow exists but isn't theirs; use hidden when the module itself is entirely out of the user's scope.
- The Owner/Dokter/Kasir role switcher in `Parakita - Key Screens.dc.html` demonstrates this: sidebar contents change per role, never just an icon dimming.

## 6. Responsive layout

Primary target is desktop/tablet (clinic front-desk and back-office workstations); the sidebar collapses to icon-only under 1024px and to an overlay drawer under 768px. No phone-first layout is required for this release (confirm with the user if a tablet check-in kiosk or clinician mobile view is planned later).

## 7. Accessibility

WCAG 2.1 AA (see design-system.md §9). Minimum 44×44px hit targets on touch-capable clinic devices (check-in kiosk, tablet EMR). Keyboard focus is always visible; never `outline: none` without a replacement ring.

## 8. Copy tone

English language for all product labels, actions, and messages (clinic staff-facing); technical/system terms (module names in code, API fields, status enum values like `BOOKED`/`WAITING`) stay in English since they mirror the SAD's domain language 1:1 — this avoids translation drift between UI copy and backend contracts.
