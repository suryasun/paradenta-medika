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

---

## 14. Patient Module Enhancement — New UI Elements (task-284–289)

New elements added to the pages/tabs in §12, not new pages. Full field-level source: `docs/03-sad/12-module-patient.md` §5.1/§14.3/§14.5/§21.

- **Photo upload (Profile tab).** A single avatar-style upload control on the Profile tab (Register Patient and Patient Detail's Profile tab both), replacing/filling `photoUrl`. Accepts the same JPG/JPEG/PNG/WEBP, 5 MB limit already documented in the SAD's File Upload Security section (§29.4) — no new upload-policy decision needed here, this UI just surfaces an existing rule.
- **Insurance & social fields (Profile tab).** `insuranceNumber`, `instagramHandle`, `facebookHandle`, `tiktokHandle`, `whatsappNumber` are added as plain optional text inputs on the Profile tab, grouped under a "Kontak Tambahan" sub-heading so they read as supplementary, not core identity fields.
- **Referral source (Profile tab, at registration).** A single-select dropdown ("Dari mana Anda mengetahui klinik kami?") sourced from the new Master Data Referral Source catalog. When the selected option has `requiresReferrer: true` (currently only "Staf Klinik"), a second field appears inline — a searchable staff/doctor/nurse picker — bound to `referredByUserId`. This second field is hidden entirely (not just disabled) for every other source, so the form never shows an irrelevant "who referred you" prompt for a "Google" or "Datang Sendiri" selection.
- **Address tab — cascading region selects.** The Address tab's form becomes four chained selects (Provinsi → Kabupaten/Kota → Kecamatan → Kelurahan/Desa), each populated only after its parent is chosen (a Kecamatan select stays disabled/empty until a Kabupaten/Kota is picked), plus the existing free-text `addressLine` and `postalCode` fields. Multiple addresses remain supported (existing tab behavior); exactly one is marked "Alamat Utama" via a radio/star toggle, matching the `isPrimary` business rule.
- **Emergency Contact tab.** No new UI beyond what §12.2 already lists — this tab already exists and already matches the `patient_emergency_contacts` shape (name, relationship, phone, optional address); no change needed here.

Quick Add Patient is **not** a Patient-module page — it is a modal launched from the Reservation booking screen. See `docs/02-design/pages/overview.md`'s gap note for where it belongs, since Reservation has no page-level spec of its own yet to host it in.

