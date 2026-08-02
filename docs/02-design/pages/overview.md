# Pages

Index of page-level design specs. Per project policy, this index only documents what is actually specified in the source SAD — it does not invent page inventories for modules that lack them.

---

# 1. Pages With Source Specification

| Module | Source | Status |
|---|---|---|
| Patient | `docs/03-sad/12-module-patient.md` Section 12 (UI Pages) | Specified — see [patient.md](./patient.md) |

# 2. Modules Without a Page-Level Spec

The following modules have no "UI Pages" (or equivalent) section in their SAD document: Master Data, Reservation, Queue, EMR, Billing, Finance, Warehouse, Human Resource, Reporting & Dashboard, System Administration.

This is a **Missing Documentation** gap per project policy (`CLAUDE.md`: "If information is missing, explicitly report the missing documentation instead of guessing"). Frontend page inventories for these modules must not be inferred from the backend API/use-case list alone; they require an explicit design pass (Figma + page spec) before implementation, because page composition, layout, and interaction are design decisions, not architecture decisions.

Until that design pass happens, `docs/01-prd/features/<module>.md` is the closest available reference for what functionality each module's (currently unspecified) pages must expose.
