# Pages: EMR Module

> Status: **Proposed Design** — derived from `docs/01-prd/features/emr.md` (EMR-001…015) and the Odontogram sub-module acceptance criteria. EMR's clinical business rules are NOT consolidated here — implementers must read `docs/03-sad/15-module-emr.md` directly per the note in `acceptance-criteria/emr.md`.

---

## Page Inventory

| Page | Purpose |
|---|---|
| Visit Workspace | Rekam medis aktif — hub untuk semua sub-proses klinis (SOAP, odontogram, diagnosis, dst) |
| Odontogram | Chart gigi interaktif — kondisi & riwayat tindakan per gigi |
| SOAP Note | Subjective / Objective / Assessment / Plan |
| Treatment Plan | Rencana tindakan + estimasi biaya |
| Prescription | Resep obat |
| Clinical Attachment / X-Ray | Upload & lihat foto klinis, hasil rontgen |
| Clinical Timeline | Riwayat kronologis seluruh kunjungan & tindakan pasien |
| Medical Certificate | Terbitkan surat keterangan sakit/sehat |
| Referral | Rujukan ke spesialis lain |

## Visit Workspace Sections

```text
Visit Workspace
├── Patient header (name, MRN, age, allergy flag)
├── Tabs: Vital Sign · SOAP · Odontogram · Diagnosis · Treatment Plan · Procedure · Prescription · Attachments
├── Clinical Timeline (right rail)
└── Actions: Save Draft · Close Visit
```

## Odontogram (highest-fidelity screen in this module)

32-tooth interactive chart (adult) with per-tooth condition color-coding (using the status token palette — never invented colors), per-surface state, and a click-to-open procedure history panel. This is the one EMR screen worth a dedicated high-fidelity mockup pass before implementation — flag to the user as a follow-up.
