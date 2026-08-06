# Feature: Reservation

> Source: derived from `docs/03-sad/13-module-reservation.md`. Scope and use cases below are extracted directly from that document; no capability is added beyond what it specifies.

---

## Scope

# 3. Scope

## 3.1 In Scope

Modul Reservation mencakup fitur berikut:

- Create Reservation
- Update Reservation
- Cancel Reservation
- Reschedule Reservation
- Walk-in Registration
- Check Availability
- Doctor Schedule Validation
- Reservation Search
- Reservation Timeline
- Reservation History
- Check-in Patient
- Queue Generation
- Reservation Notes

---

## 3.2 Out of Scope

Fitur berikut belum termasuk dalam implementasi versi pertama.

- Online Payment
- WhatsApp Reminder
- SMS Reminder
- Patient Self Booking
- Google Calendar Synchronization
- Telemedicine Appointment
- Multi Clinic Booking

---

## 3.3 Future Scope

Pengembangan berikut direncanakan pada versi selanjutnya.

- Mobile Patient Booking
- WhatsApp Integration
- Automatic Reminder
- AI Schedule Recommendation
- Waiting List
- Online Reschedule
- Calendar Synchronization
- Multi Branch Reservation

---


---

## Use Cases / Functional Flow

# 11. Functional Requirements

## 11.1 Overview

Reservation Module menyediakan seluruh fungsi yang dibutuhkan untuk mengelola jadwal kunjungan pasien mulai dari pembuatan reservasi hingga proses check-in.

---

## 11.2 Functional List

| Code | Feature | Description |
|------|----------|-------------|
| RSV-001 | Create Reservation | Membuat reservasi baru |
| RSV-002 | Update Reservation | Mengubah informasi reservasi |
| RSV-003 | Cancel Reservation | Membatalkan reservasi |
| RSV-004 | Reschedule Reservation | Mengubah jadwal reservasi |
| RSV-005 | Search Reservation | Pencarian reservasi |
| RSV-006 | Reservation Detail | Melihat detail reservasi |
| RSV-007 | Doctor Availability | Melihat jadwal dokter |
| RSV-008 | Check Availability | Validasi slot jadwal |
| RSV-009 | Walk-in Registration | Registrasi pasien datang langsung |
| RSV-010 | Check-in Patient | Mengubah reservasi menjadi antrean |
| RSV-011 | Reservation Timeline | Riwayat perubahan status |
| RSV-012 | Reservation History | Riwayat reservasi pasien |
| RSV-013 | ~~Quick Add Patient~~ **(retired, task-297)** | Registrasi cepat pasien baru langsung dari layar booking — digantikan sepenuhnya oleh RSV-016 (Quick New Patient Call), yang membuat pasien + reservasi dalam satu transaksi. Lihat `docs/03-sad/12-module-patient.md` §21.1a dan `docs/03-sad/13-module-reservation.md` §40.3 |
| RSV-014 | Determine Patient Type At Booking | Menandai reservasi sebagai `NEW` atau `OLD` berdasarkan riwayat reservasi pasien — server-side, bukan diturunkan di klien. Lihat `docs/03-sad/13-module-reservation.md` §39 |
| RSV-015 | Filter by Patient Type | Filter `patientType` pada daftar reservasi dan daftar pasien |
| RSV-016 | Quick New Patient Call | Form gabungan satu langkah: buat pasien baru + reservasi dalam satu transaksi, termasuk sumber rujukan (referral source) opsional sejak task-296 — satu-satunya jalur "pasien belum terdaftar" yang tersedia sejak RSV-013 diretired |
| RSV-017 | New Patient Date-Range Report | Laporan reservasi Pasien Baru pada rentang tanggal, dengan ringkasan statistik |
| RSV-018 | Reservation History (clinic-wide) | Layar riwayat reservasi seluruh klinik dengan filter/pencarian, dibatasi pada reservasi dengan tanggal sebelum hari ini (task-298) — berbeda dari RSV-012 yang khusus per pasien (tab di Patient Detail), dan dari RSV-005 (Reservation List) yang kini dibatasi pada hari ini dan seterusnya |
| RSV-019 | Completed Reservations Report | Laporan reservasi berstatus `COMPLETED` pada rentang tanggal, dengan tabel dan grafik tren harian — lihat `docs/03-sad/13-module-reservation.md` §40 |

---

## 11.3 Functional Dependency

```text
Patient Module
        │
        ▼
Reservation Module
        │
        ▼
Queue Module
        │
        ▼
EMR Module
```

---

