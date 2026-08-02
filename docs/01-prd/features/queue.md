# Feature: Queue

> Source: derived from `docs/03-sad/14-module-queue.md`. Scope and use cases below are extracted directly from that document; no capability is added beyond what it specifies.

---

## Scope

# 3. Scope

## In Scope

Queue Module mencakup:

- Queue Number Generator
- Patient Check-In
- Walk-in Queue
- Reservation Queue
- Queue Calling
- Queue Recall
- Queue Skip
- Queue Cancel
- Queue Complete
- Waiting Time Tracking
- Service Time Tracking
- Queue Dashboard
- Queue History

## Out of Scope

Queue Module tidak mencakup:

- Pendaftaran pasien baru
- Booking reservasi
- Pemeriksaan dokter
- Input tindakan medis
- Pembayaran
- Stock management

Seluruh fungsi tersebut berada pada module lain.

---


---

## Use Cases / Functional Flow

# 12. Queue Workflow Overview

```mermaid
flowchart LR

Patient

-->

Registration

-->

Check In

-->

Generate Queue

-->

Waiting

-->

Doctor Call

-->

Treatment

-->

Completed
```

Workflow ini berlaku baik untuk pasien reservasi maupun walk-in.

---

