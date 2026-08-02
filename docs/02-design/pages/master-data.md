# Pages: Master Data Module

> Status: **Proposed Design** — derived from `docs/01-prd/features/master-data.md` (catalog of 28 reference data types) and `docs/01-prd/business-rules.md` §1. Not a verbatim SAD spec (none exists for this module's UI); do not treat as architecture.

---

## Page Inventory

Master Data covers 28 reference catalogs (Clinic, Branch, Department, Room, Dental Chair, Doctor, Employee, Specialization, Treatment, Treatment Category, Medicine, Medical Item, Consumable, Supplier, Insurance, Payment Method, Bank, Tax, Discount, Promotion, Diagnosis Reference, Tooth Condition Reference, Procedure Code, Unit, Currency, Nationality, Religion, Occupation, Education). Rather than 28 separate pages, group by a shared list+form pattern:

| Page | Purpose | Applies to |
|---|---|---|
| Reference Data List | List/search/filter one catalog, Active/Inactive toggle | All 28 catalogs |
| Reference Data Form (Create/Edit) | Add or edit one entry; Code field locked after first transaction use | All 28 catalogs |
| Reference Data Detail | View-only, shows usage/reference count before allowing edit of locked fields | Catalogs with transaction dependency (Treatment, Payment Method, Tax, Supplier…) |
| Import / Export | Bulk import (CSV/Excel) with validation preview, export current list | All 28 catalogs |

## List Page Sections (generic pattern)

```text
Reference Data List
├── Catalog switcher (sidebar or tab: Clinic / Branch / Doctor / Treatment / …)
├── Search + Active/Inactive filter + Branch-scope filter (where applicable, see business-rules.md §12.4)
├── Table (Code, Name, Scope, Status, Last Updated, Actions)
└── Actions: View · Edit · Deactivate · Export
```

## List Actions

| Action | Description |
|---|---|
| View | Melihat detail & usage count |
| Edit | Mengubah data (Code terkunci bila sudah dipakai transaksi) |
| Deactivate | Menonaktifkan (bukan hapus permanen — lihat business-rules.md §12.2) |
| Import | Upload massal dengan preview validasi |
| Export | Export katalog terpilih |

Branch-scoped vs. global catalogs (business-rules.md §12.4) must show a branch selector only for branch-specific entries (Promotion, Room, Dental Chair, Doctor Schedule).
