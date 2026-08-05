# Acceptance Criteria: Reservation

> Source: `docs/03-sad/13-module-reservation.md`, Section 36 — Test Scenarios.

---

# 36. Test Scenarios

## 36.1 Functional Test

| Test Case | Expected Result |
|------------|----------------|
| Create Reservation | Success |
| Update Reservation | Success |
| Cancel Reservation | Status berubah menjadi Cancelled |
| Reschedule | Jadwal berhasil diperbarui |
| Check-in | Queue berhasil dibuat |
| Walk-in | Reservasi berhasil dibuat |
| Search Reservation | Data ditemukan |
| Export Report | File berhasil dibuat |

---

## 36.2 Validation Test

| Scenario | Expected Result |
|-----------|----------------|
| Slot penuh | Ditolak |
| Jadwal dokter tidak aktif | Ditolak |
| Tanggal di masa lalu | Ditolak |
| Double booking | Ditolak |
| Pasien tidak aktif | Ditolak |

---

## 36.3 Integration Test

| Module | Test |
|----------|------|
| Patient | Validasi pasien |
| Queue | Generate antrean |
| EMR | Membuka kunjungan |
| Authentication | Validasi login |
| Authorization | Validasi permission |
| Reporting | Sinkronisasi laporan |

---

## 36.4 Performance Test

Target performa sistem:

| Activity | Target |
|----------|--------|
| Reservation Search | < 1 detik |
| Create Reservation | < 2 detik |
| Check-in | < 2 detik |
| Reservation Detail | < 1 detik |
| Dashboard Loading | < 3 detik |

---

## New in This Pass (Reservation Module Enhancement, task-290–294)

Unlike the rest of this module, the 5 new capabilities below have concrete, literal rules newly authored directly in `docs/03-sad/13-module-reservation.md` §39 and `docs/01-prd/business-rules.md` §7.5 as part of this same documentation pass — these AC entries are derived from that new source text, not fabricated independently of it:

- **Patient Type Categorization (task-290):** a reservation is tagged `NEW` if the patient has no prior reservation with status outside `CANCELLED`/`NO_SHOW`; otherwise `OLD`. Determination is server-side only. `patient_type_at_booking` is a permanent snapshot — never retroactively changed. (Source: §7.5, §39.2, §39.5)
- **New Patient Date-Range Report (task-291):** `GET /reports/reservations/new-patients` returns only reservations where `patient_type_at_booking = NEW` within an inclusive, clinic-timezone-aware date range, plus summary stats (total new patients, top procedure, conversion rate). CSV/PDF export is explicitly out of scope for this pass — flagged, not implemented. (Source: §39.4, §39.7)
- **Quick New Patient Call (task-292):** `POST /reservations/quick-call` creates the patient and the reservation in one atomic transaction — a partial failure must not leave an orphaned patient without a reservation, or vice versa. Distinct from the existing Quick Add Patient (task-289): that flow creates only the patient and returns control to a separate booking step. (Source: §7.5, §39.3)
- **Reservation Calendar / Agenda View (task-293):** a genuinely new screen — no prior calendar/agenda UI exists in this codebase (the existing `TimeSlotPicker` is a slot-picker, not a calendar). Day/Week/Month/Agenda toggle, mini-month picker, entries grouped by day in Agenda mode. (Source: §39.6)
- **Reservation History (task-294):** a clinic-wide, filterable history screen (Status/Patient Type/Date Range/Procedure filters, search, card list) — distinct from the existing per-patient Reservation History tab on Patient Detail. Not modeled on any pre-existing "Care Plan History" screen — no such screen exists in this codebase; designed fresh. (Source: §39.6, §39.7)

These are documentation-derived expectations for the *design*, not a substitute for the existing formal §36 Test Scenario section above — a future implementation pass should fold concrete new test cases into §36.1–36.4 directly, matching this file's existing structure.

---

