# UI Guidelines

## Missing Documentation

`docs/03-sad/` does not define interaction patterns, layout rules, or component usage guidance — this is a backend-focused Software Architecture Document set and does not include a UI/UX guideline document. Verified by full-text search across all 26 SAD documents; no matches for "interaction pattern", "layout rule", or similar terms.

Per project policy, no interaction or layout rules are invented here.

## Binding Constraints From Existing Documentation

While there is no dedicated UI guideline document, the following **frontend requirements are binding** per `CLAUDE.md` (project instructions, "FRONTEND RULES" section) and must be satisfied by whatever UI guidelines are eventually authored:

- Never redesign UI; use the Design System (see `docs/02-design/design-system.md` — currently also a documentation gap).
- Reuse components whenever possible.
- Every page/flow must implement: Loading State, Empty State, Error State.
- Responsive Layout is required (per `docs/03-sad/01-system-overview.md` Section 17 Architecture Quality Attributes and the Next.js/TailwindCSS stack).
- Accessibility must be addressed (no specific WCAG target level is given in source documentation — this itself is a documentation gap that should be closed before implementation).
- Permission Guards must reflect RBAC (`docs/03-sad/02-system-architecture.md` Section 17, Authorization & RBAC) — UI must hide/disable actions the current user's role/permission does not allow, while never relying on that hiding as the actual security boundary (enforcement is server-side, see `docs/02-design/navigation.md` Section 1).

## Recommended Action

A UI/UX designer should author concrete interaction and layout guidelines (form validation display, table pagination/sorting/filtering UX, modal vs. page-level flows, confirmation patterns for destructive actions such as Void/Cancel/Delete, and the accessibility target) referencing the module list in `docs/01-prd/features/overview.md`.
