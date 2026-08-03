# Pages: Patient Module

> Source: `docs/03-sad/12-module-patient.md` Section 12 (UI Pages) and Section 12.2–12.3 (Detail Tabs, List Actions), verbatim.

---

# 12. UI Pages

## 12.1 Patient Module Pages

| Page | Purpose |
|------|---------|
| Patient List | Menampilkan seluruh pasien |
| Register Patient | Registrasi pasien baru |
| Patient Detail | Informasi lengkap pasien |
| Edit Patient | Mengubah data pasien |
| Visit History | Riwayat kunjungan |
| Reservation History | Riwayat reservasi |
| Treatment History | Riwayat tindakan |
| Payment History | Riwayat pembayaran |
| Merge Patient | Penggabungan pasien |
| Patient Archive | Data pasien yang diarsipkan |

---

## 12.2 Patient Detail Tabs

```text
Patient Detail

├── Profile
├── Identity
├── Address
├── Emergency Contact
├── Reservation History
├── Visit History
├── Treatment History
├── Payment History
├── Attachments
└── Audit Trail
```

---

## 12.3 Patient List Actions

| Action | Description |
|---------|-------------|
| View | Melihat detail pasien |
| Edit | Mengubah data pasien |
| Register Reservation | Membuat reservasi |
| View History | Melihat riwayat pasien |
| Upload Photo | Mengunggah foto pasien |
| Export | Export data |
| Archive | Arsipkan pasien |

---

## 13. Interactivity (2026 refresh — `design-system.md` §11, `ui-guidelines.md` §9)

Patient Detail's Profile/Identity/Address/Emergency Contact tabs (§12.2) are simple field sets, well-suited to **inline edit** (`ui-guidelines.md` §9.3) the same way `master-data.md` §9 argues for Master Data's catalogs — a hover-edit pencil per field, commit on blur, rather than a full Edit-Patient page round-trip for a single corrected phone number. Reservation/Visit/Treatment/Payment History tabs stay read-only lists (no inline edit — they're derived records from other modules, not owned here). **Live update** applies to Reservation/Visit History specifically: a patient's history tabs should reflect a just-completed Reservation check-in or Visit close without a manual page refresh, cross-fading the new row in per `ui-guidelines.md` §9.2 rather than popping it in. Patient List's row-click-to-view-detail interaction gets a `motion-micro` press state (§11.7) on the row itself, not just the "Lihat" link, so the whole row visibly registers the click.

