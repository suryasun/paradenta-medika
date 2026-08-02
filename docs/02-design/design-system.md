# Design System

## Missing Documentation

`docs/03-sad/` and `docs/04-ai-contract/` do not define a visual design system — no color palette, typography scale, spacing scale, component library, or design tokens are specified anywhere in the source documentation. This was verified by full-text search across all 26 SAD documents and all 10 AI Contract documents.

Per project policy (`CLAUDE.md`: "You are NOT allowed to redesign the product or architecture... Never make architectural assumptions... If information is missing, explicitly report the missing documentation instead of guessing"), no color values, fonts, or component styles are invented here.

## What the Source Documentation Does Specify

The only design-system-adjacent facts available are technology choices, not visual specifications:

| Item | Value | Source |
|---|---|---|
| CSS Framework | TailwindCSS | `docs/03-sad/02-system-architecture.md` Appendix A.1 |
| Frontend Framework | Next.js App Router + TypeScript | `docs/03-sad/01-system-overview.md` Section 26 |
| Component Constraint (frontend rules) | "Use Design System. Reuse components whenever possible. Never redesign UI." | `CLAUDE.md` (project instructions) |

Because Tailwind is a utility framework rather than a design system in itself, a Tailwind config (`tailwind.config.js`) encoding actual brand colors, font family, spacing scale, and breakpoints is required before any UI component can be built consistently.

## Recommended Action

A UI/UX designer or design system owner should author:

1. Color palette (primary/secondary/semantic colors, including states like error/warning/success — referenced implicitly by `docs/03-sad/03-clean-architecture.md`'s requirement for Loading/Empty/Error states, but never given concrete values).
2. Typography scale (font family, sizes, weights).
3. Spacing/sizing scale.
4. A base component inventory (buttons, inputs, tables, modals, badges for status values like Reservation status BOOKED/WAITING/CALLED/etc.).
5. A `tailwind.config.js` (or equivalent) encoding the above as design tokens.

Until this exists, frontend implementation should not invent ad hoc colors or spacing per component, since that would violate the "Use Design System" instruction in `CLAUDE.md` — there is currently no design system to reuse from.
