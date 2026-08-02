# Acceptance Criteria: Human Resource

> Source: `docs/03-sad/19-module-hr.md`, Section "Test Scenarios and Acceptance Criteria".

---

# 11. Skenario Pengujian dan Acceptance Criteria

| ID | Skenario | Expected result |
|---|---|---|
| TC-HR-001 | Activate employee valid | Employee code unique, history/event tercatat |
| TC-HR-002 | Schedule overlap | Ditolak tanpa membuat schedule parsial |
| TC-HR-003 | Attendance check-out sebelum check-in | 422, record tidak valid tidak tersimpan |
| TC-HR-004 | Duplicate attendance | Conflict dan record existing tetap tunggal |
| TC-HR-005 | Leave quota tidak cukup | Submit ditolak, quota tidak berubah |
| TC-HR-006 | Approve leave | Quota dialokasikan dan schedule/status terkait diperbarui sesuai policy |
| TC-HR-007 | Employee self-approves leave | 403 self-approval forbidden |
| TC-HR-008 | Approved overtime enters payroll | Masuk sekali dengan rate/rule snapshot |
| TC-HR-009 | Overtime reused in second payroll | Ditolak; payroll link unik |
| TC-HR-010 | Calculate payroll | Totals reproducible dari source snapshot dan rule version |
| TC-HR-011 | Source changes after calculation | Payroll stale dan wajib recalculate sebelum approval |
| TC-HR-012 | Creator approves own payroll | Ditolak oleh segregation-of-duties |
| TC-HR-013 | Approve payroll twice | Hanya satu event Finance logical tercipta |
| TC-HR-014 | Edit locked payroll | Ditolak; adjustment route tersedia |
| TC-HR-015 | Finance retries event | Tidak ada jurnal/payroll posting ganda |
| TC-HR-016 | Cross-branch salary access | Ditolak atau data termask sesuai permission |
| TC-HR-017 | Payslip self-service | Employee hanya membaca payslip dirinya, access log tercatat |
| TC-HR-018 | Terminate employee | Future normal schedule blocked; history/payroll tetap tersedia |

Acceptance criteria:

- Data employment dan payroll sensitive hanya dapat diakses oleh principal yang authorised.
- Payroll approved dapat direproduksi dari input/rule snapshot dan tidak berubah oleh data baru.
- Tidak ada payroll final duplicate pada employee-periode yang sama.
- Event Finance bersifat idempoten, minimal data, dan traceable ke payroll asal.
- Perubahan penting memiliki history/audit; tidak ada mutasi langsung atas record locked/final.

---

