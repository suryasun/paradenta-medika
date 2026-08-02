# Pages: System Administration Module

> Status: **Proposed Design** — derived from `docs/01-prd/features/system.md` (UC-SYS-001…007).

---

## Page Inventory

| Page | Purpose |
|---|---|
| User Administration | Provision/deactivate user, link employee, branch assignment |
| Role & Permission | Kelola role, permission catalog, role-permission mapping |
| Menu Management | Atur hierarki menu, urutan, icon, route, menu-permission mapping |
| System Parameter | Konfigurasi bertingkat (branch → clinic → global) dengan versioning |
| Feature Flag | Kelola flag & rollout scope |
| Notification Template | Template notifikasi multi-channel/locale |
| Audit / Activity Log | Log audit (read-only, append-only) dan activity timeline |
| Background Job Monitor | Antrean job, retry/cancel, status |

## Role & Permission Sections

```text
Role & Permission
├── Role list (system roles locked from deletion — business-rules.md System §3.4)
├── Permission matrix (role × permission, checkbox grid)
├── Change request flow: propose → (approval if high-risk) → effective time → cache invalidation
└── Audit trail of every mapping change (old/new, correlation id)
```

## Audit Log Page

Read-only by design (`system.md` §1.5 "Immutable audit"): the UI must not render an Edit or Delete action anywhere on this page, and querying/exporting the log itself produces a new audit event — surface that as inline microcopy, consistent with the Reporting module's export note.
