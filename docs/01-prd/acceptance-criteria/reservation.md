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

