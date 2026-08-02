# Design System — Parakita Medika

> Status: **resolved**. This replaces the earlier "Missing Documentation" gap report. Source: the attached Figma file `materialize-figma-admin-dashboard-uikit-v4` (Materialize Admin Dashboard UI Kit), re-themed for a dental clinic product. Component structure, spacing/radius scale, and interaction states are taken from that kit verbatim; only the primary/secondary/semantic hues were changed. This is a **new design artifact**, not a value extracted from `docs/03-sad/`, per the gap this file previously reported.

Live references (this project):
- `Parakita - Design System.dc.html` — foundations (color, type, spacing, radius) + component gallery, with a light/dark toggle.
- `Parakita - Key Screens.dc.html` — Dashboard, Patient List, Patient Detail, Queue Board mockups with a role switcher (Owner / Dokter / Kasir) and dark mode.
- `components/Components.bundle.js` + `Components.d.ts` — the materialized source components (usable directly in React/Next.js).
- `components/fig-tokens.css` — original Figma Variables as CSS custom properties (structure/scale).
- `components/dental-tokens.css` — the dental-clinic re-theme; **load after** `fig-tokens.css` so it overrides the base color ramps.

---

## 1. Brand direction

Clinical, calm, trustworthy — a teal/blue accent on a light neutral ground (with a first-class dark mode), condensed data density suited to an operations-heavy admin app (tables, forms, KPI cards) rather than a marketing site.

## 2. Color

Token **structure** (100–900 ramps per role, `-main/-light/-dark`, `-opacity-*` states, `theme-*` action/text roles, `dark-*` mode overrides) is Materialize's own Figma Variable system, kept intact. Only hue values changed:

| Role | Base (500) | Usage |
|---|---|---|
| Primary (teal) | `rgb(20,145,155)` / `#14919B` | Primary actions, active nav, links, brand mark |
| Secondary (slate) | `rgb(96,115,122)` | Secondary buttons, muted UI chrome |
| Success (green) | `rgb(46,158,91)` | Paid, completed, active, on-target KPIs |
| Warning (amber) | `rgb(240,160,32)` | Waiting, low stock, pending approval |
| Error (red) | `rgb(225,75,71)` | Void, cancelled, overdue, destructive actions |
| Info (indigo-blue) | `rgb(53,120,246)` | Booked, informational states — kept visually distinct from primary teal |

Each role carries a full 100–900 ramp in `dental-tokens.css`. Use step 100–200 for tinted backgrounds, 500 as the base, 700 for text-on-tint in light mode, and 300 for text-on-tint in dark mode (see §6 Dark Mode).

Neutral/background tokens (`--misc-body-bg`, `--misc-paper`, `--theme-text-primary/secondary`, `--theme-divider`, `--theme-outline-border`) are unchanged from the source kit — they're already a neutral light/near-navy pairing that reads clinical rather than warm.

## 3. Typography

**Inter** for all UI text (headings and body) — the dominant font in the source Figma file. No second display face; an operations app should not compete for attention with its own type.

| Style | Size / Weight | Usage |
|---|---|---|
| Display | 32 / 700 | Rare — top-level page hero only |
| H1 | 26 / 700 | Page title |
| H2 | 22 / 700 | Section header |
| H3 | 18 / 600 | Card / panel title |
| Subtitle | 15 / 600 | Table group header, form section |
| Body 1 | 14 / 400 | Default UI text |
| Body 2 | 13 / 400 | Secondary/supporting text |
| Caption | 12 / 500 | Table column headers (uppercase), meta labels |

Minimum body size is 13px; never go below 12px even for captions (accessibility floor for an app used on clinic desktops and tablets).

## 4. Spacing & radius

Both scales are taken directly from the Figma `Primitives` variable collection (unitless steps × 1px): **4, 8, 12, 16, 20, 24, 28, 32, 36, 40…** Use the 4px step for icon-to-label gaps, 16–20px for card padding, 24–32px for section gaps.

Radius: `xs 2px` (chips/tags), `sm 4px` (inputs), `md 6px` (buttons), `lg 8px` (cards, modals), `round 500px` (pills/avatars). Never use a radius outside this scale.

## 5. Elevation

Two levels only, matching the kit: a 1px hairline border (`--theme-divider`) for resting cards/tables, and a soft shadow (from Figma's shadow tokens) only for floating surfaces — dropdowns, dialogs, toasts. Don't shadow resting page content; the density of an ops dashboard reads cleaner flat.

## 6. Dark mode

Fully supported. Toggle sets `data-theme="dark"` on `<html>`; both token files respond automatically for structural roles (background/text/divider/action states). **Status pill and KPI-delta text colors are the one place that needs a manual swap** — a ramp's `-700` step (used for text-on-tint in light mode) is too dark to read against a dark page, so in dark mode use the ramp's `-300` step instead, and widen the tint opacity from `-16` to `-24`. Both DC files implement this via a `pair(hue)` helper in their logic class — reuse that pattern in the Next.js build (a small `getStatusColors(hue, isDark)` utility).

## 7. Component inventory (source → dental use)

| Figma component | Bundle export | Dental clinic usage |
|---|---|---|
| Button (486 variants, collapsed to 1 in auto-extract) | — | **Hand-build** 4 variants (solid/outline/text/danger) + icon button from tokens — see the Buttons section of the style guide DC for the reference markup |
| TextField/Outlined, input-outlined | `InputOutlined` | All form fields (patient registration, EMR forms, master data) |
| select-outlined, Form Select | `SelectOutlined`, `FormSelect` | Dropdowns (doctor, branch, treatment, payment method) |
| Checkbox / Radio / Switch / Slider | `Checkbox`, `Radio`, `Switch`, `Slider` | Consent checkboxes, gender radio, toggle settings, volume/opacity-style sliders |
| Cards, CardHeader | `Cards`, `CardHeader` | Dashboard KPI cards, summary panels |
| Chip | `Chip` | Payment method tags, filter chips, multi-select tags |
| Badge | `Badge`, `Badge3` | Notification counts, "new" markers |
| Avatar | `Avatar` | Patient/doctor/employee avatar |
| Alert | `Alert` | Inline success/warning/error banners (form validation summary, stock alerts) |
| Snackbar / Tost | `Snackbar`, `Tost` | Toast confirmations ("Data tersimpan") |
| Tooltip | `Tooltip` | Icon-only button hints |
| Progress | `Progress` | Upload progress, stock level, payroll processing |
| Pagination | `Pagination` | All list/table pages |
| TableHead / TableCell | `TableHead`, `TableCell` | Data tables (patients, invoices, stock, employees) |
| ListItem, Menu/MenuItem | `ListItem`, `Menu`, `MenuItem` | Dropdown menus, notification list |
| BreadcrumbLink | `BreadcrumbLink` | Page breadcrumb (e.g. Pasien / Detail Pasien) |
| Horizontal/Vertical Stepper | `HorizontalStepper`, `VerticalStepper` | Multi-step forms (patient registration, PO approval) |
| TimelineItem / TimelineDot | `TimelineItem`, `TimelineDot` | EMR clinical timeline, audit trail, reservation history |
| Vertical Navbar Scroll | `VerticalNavbarScroll` | Sidebar shell reference (hand-built in the screens DC to carry RBAC-filtered menu data) |
| Footer | `Footer` | App shell footer (version, support link) |

**Note on Button:** Figma's automatic variant extraction collapsed the 486-variant Button component set to a single baked instance (a known limitation of large variant families — see extraction warnings). Do not use the bundle's `Button` export as-is; use the hand-built button markup in the style guide DC (4 variants, tokens-driven, so dark mode and re-theming both work correctly).

## 8. Status badge mapping (cross-module)

A single semantic mapping used everywhere a status pill appears — do not invent new colors per module:

| Domain status | Token pair |
|---|---|
| Reservation: Booked / Queue: Called | Info |
| Reservation: Confirmed / Queue: In Service | Primary |
| Reservation: Checked-in / Queue: Completed / Invoice: Paid | Success |
| Queue: Waiting / Invoice: Partial / Warehouse: Low stock | Warning |
| Reservation: Cancelled / Invoice: Unpaid / Billing: Void | Error |
| No-show / Skipped / Archived / Void | Neutral (`--theme-action-hover` bg, `--theme-text-secondary` fg) |

## 9. Accessibility target

WCAG 2.1 AA (this closes the gap `ui-guidelines.md` flagged — no level was specified in the SAD). Concretely: 4.5:1 minimum contrast for body text, 3:1 for large text/icons, visible focus ring using `--color-primary-primary-500` at 2px offset, and never color-only status communication — every status pill carries a text label, never a bare dot.

## 10. What's still open

- No real product photography/branding assets exist yet (logo beyond the "PM" monogram placeholder, favicon, login illustration). Ask the user before inventing these.
- The Button hand-build above should be lifted into a proper reusable component (React) during Claude Code implementation — it's currently reference markup inside the style guide DC, not a packaged component.
