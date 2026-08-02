# Acceptance Criteria: EMR

> Source: `docs/03-sad/15-module-emr.md`, Section 39 — Acceptance Criteria (Odontogram sub-module).

> Note: `15-module-emr.md` is a very large, multi-part document (11,907 lines) and contains several additional Acceptance Criteria / Acceptance Test sections scoped to specific EMR sub-modules — Periodontal Assessment (line 6013, "43. Acceptance Test"), Clinical Attachment (line 11019, "17. Acceptance Test"), and others (lines 4746, 8748). Those sub-module-specific acceptance tests are not duplicated here; consult `docs/03-sad/15-module-emr.md` directly at those line references before writing test cases for those specific EMR sub-features, per the project rule against inventing or summarizing business/test rules that are not explicitly reproduced from source.

---

# 39. Acceptance Criteria

## Functional

- Dokter dapat memilih Tooth.
- Dokter dapat memilih Surface.
- Dokter dapat menyimpan Condition.
- History tersimpan otomatis.
- Version dibuat otomatis.
- Timeline diperbarui otomatis.
- Audit tercatat otomatis.

---

## Non Functional

- Response < 200 ms untuk update satu Tooth.
- Mendukung minimal 100 concurrent user.
- Tidak kehilangan histori.
- Mendukung rollback melalui versioning.
- Mendukung audit penuh.

---

## Security

- Hanya Doctor dan Admin yang dapat mengubah Odontogram.
- Perubahan memerlukan Visit aktif.
- Seluruh perubahan dicatat beserta identitas pengguna.

---

