# Reservation Feature Addendum

Addendum to the existing Reservation modules. Covers 5 additions to the Reservation flow: patient type categorization, new-patient date-range report, quick-call intake form, Google Calendar-style reservation list, and reservation history view.

---

## Part 1 — Prompt for AI App Builder

addendum to the existing project prompt.

```
Add the following to the Reservation module of this Parakita app:

1. PATIENT TYPE CATEGORIZATION
   - Every reservation must be tagged as "New Patient" or "Old Patient" (returning).
   - Rule: a patient is "New" if this is their first-ever reservation in the system
     (no prior completed or scheduled appointment record exists for their patient ID).
     Once they have one prior appointment, all future reservations tag them as "Old".
   - Show this as a colored badge/pill on every appointment card, in the Patients list,
     and as a filter option (All / New / Old) on the Calendar View and Pending Requests screens.

2. NEW PATIENT DATE-RANGE REPORT
   - Add a "Reports" or "New Patient Report" screen with a date-range picker (start date,
     end date, plus quick presets: Today, This Week, This Month, Last 30 Days, Custom).
   - The report lists all reservations made by New Patients within that range: name, date,
     time, procedure, staff assigned, status, contact info.
   - Include summary stats at the top: total new patients in range, most requested
     procedure, conversion rate (New Patient reservations that became Completed vs
     No-show/Cancelled).
   - Support export to CSV/PDF.

3. QUICK PATIENT CALL FOR NEW PATIENTS
   - When creating a reservation and the caller is identified as a New Patient (no
     existing record found by phone/name search), show a single combined "Quick New
     Patient Call" form instead of two separate steps.
   - One form, one submit: patient basic info (name, phone, email, DOB) + reservation
     details (procedure/service, preferred date & time, staff/doctor, notes) captured
     together in a single input/save action.
   - On submit: create the patient record and the reservation in one transaction, tag
     the reservation "New Patient" automatically, and route it into Pending Requests
     (or directly onto the calendar if auto-confirm is enabled).

4. RESERVATION CALENDAR LIST MENU (Google Calendar style)
   - Add a new sidebar menu item "Reservation Calendar" (or extend the existing
     Calendar View) styled like Google Calendar's list/agenda view:
     - Left mini-month date picker to jump to a day.
     - Toggle between Day / Week / Month / Agenda(List) views.
     - Agenda/List view groups reservations chronologically by day, showing time,
       patient name, patient-type badge, procedure, and staff, similar to Google
       Calendar's Tasks/Agenda list.
     - Color-code entries by patient type (New vs Old) and/or status.
     - Click an entry to open reservation details in a side panel or modal.

5. RESERVATION HISTORY MENU
   - Add a "Reservation History" menu (mirrors the existing Care Plan History screen
     layout): summary bar at top (e.g. "X completed | Y cancelled/no-show | Z% new
     patients"), filters for Status / Patient Type / Date Range / Procedure, and a
     search box for patient name or procedure.
   - Each history entry is a card showing patient name, patient-type badge, date,
     procedure, status (Completed / Cancelled / No-show / Rescheduled), with actions
     "View Appointment Details" and "View Full Reservation".

Keep styling consistent with the existing UI (same sidebar, card, and badge patterns
already used in Appointments and Care Plans).
```

---

## Part 2 — Technical Requirements

### 2.1 Data model changes

**Patient**
| Field | Type | Notes |
|---|---|---|
| `patient_type` | enum(`new`, `old`) | Derived, not stored as free input — computed from appointment history; store as a cached column recalculated on each new reservation for performance. |
| `first_reservation_at` | timestamp | Set on first-ever reservation; used to compute `patient_type`. |

**Reservation / Appointment**
| Field | Type | Notes |
|---|---|---|
| `patient_type_at_booking` | enum(`new`, `old`) | Snapshot at time of booking, so historical reports stay accurate even after the patient becomes "old". |
| `source` | enum(`quick_call`, `standard`, `online`, ...) | Tags reservations created via the Quick New Patient Call form. |

### 2.2 Business rules

- **New vs Old determination**: on reservation create, check if patient has any prior appointment with status in (`completed`, `scheduled`, `confirmed`). If none exists, `patient_type_at_booking = new`; else `old`. This must be a server-side check (not client-derived) to stay deterministic and race-safe under concurrent bookings.
- **Quick Call flow**: single form submit must be wrapped in one DB transaction (create/find patient → create reservation) so a failure doesn't leave an orphaned patient record without a reservation, or vice versa.
- **Report date range**: filter reservations where `patient_type_at_booking = new` AND `reservation_date` between start/end (inclusive), timezone-aware to the clinic's configured timezone.

### 2.3 New/updated screens

1. **Calendar View** — add Patient Type filter chip (All/New/Old) alongside existing Staff filter.
2. **Reservation Calendar (Agenda)** — new screen, Day/Week/Month/Agenda toggle, mini-month picker, list grouped by date.
3. **New Patient Report** — new screen, date-range picker + summary stats + table + export.
4. **Quick New Patient Call** — new modal/form triggered from "New Appointment" when no matching patient is found.
5. **Reservation History** — new screen mirroring Care Plan History layout (status summary bar, filters, search, card list).

### 2.4 Acceptance criteria

- Booking a reservation for a phone number/name not previously in the system tags it "New" and offers the Quick Call form.
- Booking a second reservation for the same patient tags it "Old", even though their first reservation is retagged historically as "New" (snapshot preserved).
- New Patient Report returns correct counts for a given date range, verified against a manually counted seed dataset.
- Reservation Calendar Agenda view matches the reference screenshot's grouping and information density (time, name, procedure, duration).
- Reservation History cards match the reference Care Plan History layout (badge, date, title, status, two action buttons).
- All new UI reuses existing design tokens (colors, spacing, card/badge components) — no new visual system introduced.

#REFERENCE UI
docs\images\reservation calender view.PNG
docs\images\Reservation History plan'.PNG