# API Tests

> Source: `docs/04-ai-contract/04-api-contract.md` (response schema, status codes, error format — binding contract for ALL endpoints) and each module's API Specification section in `docs/03-sad/`.

---

# 1. Binding API Contract

Every API test must assert conformance to `docs/04-ai-contract/04-api-contract.md`, which defines (do not re-derive these from module docs — the AI Contract is Priority 1 per `CLAUDE.md`):

- API Versioning
- URL Conventions and Resources
- HTTP Methods and Status Codes
- Content Type and Headers
- Response Schema (success/error envelope)
- Pagination
- Filtering and Searching
- Sorting and Field Selection
- Error and Validation Responses
- Idempotency
- OpenAPI Compliance

Any API test suite must include, at minimum: (a) one test per documented status code the endpoint can return, (b) one test asserting the response envelope matches `docs/04-ai-contract/04-api-contract.md` § Response Schema, (c) one test per validation rule in the endpoint's request DTO.

# 2. Standard Error Response Format

Per `docs/03-sad/02-system-architecture.md` Section 19.4:

```json
{
  "success": false,
  "message": "Validation Failed",
  "errors": []
}
```

And the HTTP status mapping (`docs/03-sad/02-system-architecture.md` Section 19.3):

| Code | Description |
|------|-------------|
| 400 | Validation Error |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Data Not Found |
| 409 | Conflict |
| 422 | Business Validation |
| 500 | Internal Server Error |

# 3. Per-Module API Specification Reference

API tests should be written against the endpoints documented in each module's API Specification section. Do not invent endpoints not listed there (`CLAUDE.md`: "Never create undocumented endpoints").

| Module | API Specification Location |
|---|---|
| Patient | `docs/03-sad/12-module-patient.md` Section 20 |
| Reservation | `docs/03-sad/13-module-reservation.md` Section 20 |
| Queue | `docs/03-sad/14-module-queue.md` Section 56 (REST API Specification) |
| EMR | `docs/03-sad/15-module-emr.md` Section 39 (OpenAPI Specification) and equivalent sections per EMR sub-module |
| Finance | `docs/03-sad/17-module-finance.md` Section 6 |
| Warehouse | `docs/03-sad/18-module-warehouse.md` Section 6 |
| Human Resource | `docs/03-sad/19-module-hr.md` Section 6 |
| Reporting & Dashboard | `docs/03-sad/20-module-report.md` Section 6 |
| System Administration | `docs/03-sad/21-module-system.md` Section 6 |

Master Data and Billing do not have a section literally titled "API Specification" — search each document's Table of Contents for the equivalent (e.g. Billing's request/response and endpoint definitions are distributed across its 12-part document structure). This is noted here rather than guessed at.

# 4. Security Test Requirements (cross-reference)

Per `docs/04-ai-contract/09-security-contract.md` and `docs/03-sad/02-system-architecture.md` Section 17 (Authorization & RBAC), every API test suite must also include: unauthenticated request → 401, authenticated-but-unauthorized request (wrong role/permission) → 403, and — where applicable — audit trail creation assertions per `docs/03-sad/02-system-architecture.md` Section 20.
