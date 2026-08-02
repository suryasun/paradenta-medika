# Acceptance Criteria: System Administration

> Source: `docs/03-sad/21-module-system.md`, Section "Test Scenarios and Acceptance Criteria".

---

# 11. Skenario Pengujian dan Acceptance Criteria

| ID | Scenario | Expected result |
|---|---|---|
| TC-SYS-001 | Provision unique valid user | User/invitation and audit event created once |
| TC-SYS-002 | Provision duplicate username/email | 409 with no partial user/role records |
| TC-SYS-003 | Deactivate user | New access denied and session revocation requested/audited |
| TC-SYS-004 | Remove last protected admin | Blocked with `SYS_LAST_ADMIN_PROTECTED` |
| TC-SYS-005 | Role assignment outside branch scope | Rejected; no claims/cache update |
| TC-SYS-006 | Client sends forged role/branch | API policy uses server assignment and denies unauthorised action |
| TC-SYS-007 | High-risk config by maker only | Remains pending, not active |
| TC-SYS-008 | Invalid typed config | 422 and no configuration version activated |
| TC-SYS-009 | Config rollback | New version references prior value; audit/cache event exists |
| TC-SYS-010 | Enable flag for user without permission | Flag alone does not grant protected endpoint access |
| TC-SYS-011 | Menu permission removed | Menu hidden but API still independently enforced |
| TC-SYS-012 | Notification retry | Single logical delivery despite duplicate request/retry |
| TC-SYS-013 | Provider permanent failure | Notification/job dead-lettered and visible to authorised ops |
| TC-SYS-014 | Worker crashes after claim | Lease recovery retries idempotently without duplicate side effect |
| TC-SYS-015 | Attempt audit update/delete | Forbidden; audit record remains immutable |
| TC-SYS-016 | Audit persistence outage on sensitive command | Command rolled back/fails safely |
| TC-SYS-017 | Raw secret in parameter/log | Rejected/redacted; no secret in response/audit |
| TC-SYS-018 | Attachment malware scan failure | File quarantined and unavailable |

Acceptance criteria:

- Authorization denies by default and is enforced server-side for every protected resource.
- User/role/branch/config high-risk changes are versioned, scope-validated, and auditable.
- Authentication session/token management remains delegated to its owning module without bypass.
- Audit logs are append-only and sensitive values are not exposed.
- Notification and background jobs are durable, observable, idempotent, and safe to retry.

---

