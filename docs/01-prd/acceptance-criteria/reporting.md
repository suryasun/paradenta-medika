# Acceptance Criteria: Reporting & Dashboard

> Source: `docs/03-sad/20-module-report.md`, Section "Test Scenarios and Acceptance Criteria".

---

# 11. Skenario Pengujian dan Acceptance Criteria

| ID | Skenario | Expected result |
|---|---|---|
| TC-RPT-001 | Consume event pertama | Read model/KPI berubah sekali dengan watermark baru |
| TC-RPT-002 | Consume event duplikat | Tidak ada row/metric double count |
| TC-RPT-003 | Event out of order | Projection konsisten setelah ordering/defer/replay |
| TC-RPT-004 | Dashboard setelah event lag | Response menunjukkan `stale`/`partial` dan dataAsOf |
| TC-RPT-005 | Finance trial balance report | Hanya posted journal; debit = credit |
| TC-RPT-006 | Billing vs Finance reconciliation | Perbedaan ditampilkan sebagai exception, tidak merged diam-diam |
| TC-RPT-007 | HR payroll draft report | Tidak masuk payroll official total |
| TC-RPT-008 | Cross-branch dashboard request | Scope di-intersect/ditolak sesuai user assignment |
| TC-RPT-009 | Restricted payroll report | User tanpa permission tidak melihat detail/kolom restricted |
| TC-RPT-010 | Patient-level clinical report | Identifier/detail disaring sesuai EMR policy |
| TC-RPT-011 | Large export request | Job async dibuat dengan snapshot/watermark |
| TC-RPT-012 | Equivalent report job retry | Job idempotent atau diarahkan ke job aktif existing |
| TC-RPT-013 | Expired artifact download | 410 dan tidak ada file access |
| TC-RPT-014 | Spreadsheet injection content | Export sanitised tanpa formula execution |
| TC-RPT-015 | Snapshot integrity check fails | Download blocked dan incident/data-quality issue created |
| TC-RPT-016 | Projection rebuild | New version reconciled before alias switch; snapshot lama tetap referencable |
| TC-RPT-017 | Reporting outage | Source transaction tetap commit dan event dapat diproses setelah recovery |
| TC-RPT-018 | Export audit | Create/download record mencantumkan actor/scope/artifact/outcome |

Acceptance criteria:

- Reporting memiliki jalur read-only terhadap semua domain sumber.
- Setiap metric/report memiliki definition version, scope, filter, and data-as-of metadata.
- Aggregate tidak double count saat event retry dan mismatch sumber terdeteksi secara eksplisit.
- Data branch/restricted tidak bocor melalui UI, API, cache, snapshot, atau export.
- Financial reports only use Finance-authoritative posted data and retain reconciliable evidence.

---

