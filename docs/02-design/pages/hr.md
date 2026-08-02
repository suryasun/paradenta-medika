# Pages: Human Resource Module

> Status: **Proposed Design** — derived from `docs/01-prd/features/hr.md` (UC-HR-001…007).

---

## Page Inventory

| Page | Purpose |
|---|---|
| Employee List | Seluruh karyawan — filter cabang/departemen/status |
| Employee Detail | Profil, kontrak, salary history, dokumen (privacy-gated per business-rules.md HR §3.5) |
| Schedule & Attendance | Jadwal kerja + check-in/out + koreksi absensi |
| Leave Request | Pengajuan & approval cuti |
| Overtime Request | Pengajuan & approval lembur |
| Payroll Run | Kalkulasi, review, approve, lock payroll per periode |
| Payslip | Slip gaji per karyawan (self-service view, restricted) |
| Employee Termination | Proses terminasi dengan checklist & effective date |

## Payroll Run Sections (per UC-HR-005)

```text
Payroll Run
├── Period / Branch / Payroll Type selector
├── Eligible employee snapshot (salary, attendance, leave, overtime)
├── Exception list (errors per employee — does not block others)
├── Review → Approve (HR Manager/Owner) → Lock
└── Integration status (sent to Finance — read-only from HR side)
```

## Privacy note

Salary, bank account, and personal documents follow "privacy by design" (business-rules.md HR §3.1): the Employee Detail page must gate these fields behind a visible permission check, not just omit them silently — show a "Restricted — insufficient permission" placeholder rather than hiding the tab entirely, so staff understand the data exists.
