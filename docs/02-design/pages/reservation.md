# Pages: Reservation Module

> Status: **Proposed Design** — derived from `docs/01-prd/features/reservation.md` (RSV-001…012) and `docs/01-prd/business-rules.md` §3. Not a verbatim SAD UI spec.

---

## Page Inventory

| Page | Purpose |
|---|---|
| Reservation Calendar/List | Melihat seluruh reservasi (calendar view per dokter + list view) |
| Create Reservation | Membuat reservasi baru (pasien, dokter, treatment, slot) |
| Walk-in Registration | Registrasi pasien datang langsung tanpa reservasi |
| Reservation Detail | Info reservasi + timeline perubahan status |
| Reschedule Reservation | Mengubah jadwal reservasi aktif |
| Doctor Availability | Melihat jadwal & slot kosong per dokter |
| Reservation History | Riwayat reservasi per pasien |
| Check-in | Mengubah reservasi menjadi antrean (memicu Queue Module) |

## Reservation Detail Sections

```text
Reservation Detail
├── Patient & Doctor Summary
├── Schedule (date, time slot, room/chair)
├── Status Timeline (Booked → Confirmed → Checked-in → Completed / Cancelled)
├── Notes
└── Actions: Reschedule · Cancel · Check-in
```

## List Actions

| Action | Description |
|---|---|
| View | Melihat detail reservasi |
| Reschedule | Mengubah jadwal (business-rules.md §7.2 — hanya slot aktif dokter) |
| Cancel | Membatalkan; wajib alasan; tidak berlaku jika sudah Check-in (§7.4) |
| Check-in | Hanya pada hari kunjungan; otomatis generate nomor antrean (§7.3) |

Status pill mapping follows `design-system.md` §8 (Booked=Info, Confirmed=Primary, Checked-in=Success, Cancelled=Error).
