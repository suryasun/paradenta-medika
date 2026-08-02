# AI Contract 04 - API Contract

This contract is extracted only from `09-api-standard.md`. The AI Agent MUST NOT add an endpoint or API behavior that is absent from that document.

## API Versioning

**API-001** Every endpoint MUST use the `/api/{version}/{resource}` format.

**API-002** The active API version MUST be `v1` and every current endpoint MUST use `/api/v1/`.

**API-003** Breaking changes MUST be released under a new API version.

**API-004** The API version policy MUST treat `v1` as Active, `v2` as Future, and `v3` as Reserved.

**API-005** A breaking change MUST be defined as removing a response field, changing response structure, changing an endpoint, changing a required request field, or changing authentication.

**API-006** Adding a response field, adding an endpoint, adding an optional query parameter, or fixing a bug MUST NOT require a new API version.

## URL Conventions and Resources

**API-007** Resource paths MUST use lowercase plural nouns.

**API-008** Compound resource paths MUST use hyphens.

**API-009** Resource paths MUST NOT use underscores, camelCase, verbs, or action names.

**API-010** Endpoints MUST represent resources rather than actions.

**API-011** JSON field names MUST use camelCase.

**API-012** JSON dates MUST use ISO 8601 format.

**API-013** JSON collections MUST use an empty array rather than `null`.

**API-014** Nested resources MUST be used only for hierarchical relationships.

**API-015** Nested resources MUST NOT exceed two levels.

**API-016** Query parameters MUST be used when a relationship is not hierarchical.

**API-017** Collection endpoints MUST NOT receive a resource identifier in the collection path.

**API-018** Single-resource endpoints MUST use an identifier in the URL.

**API-019** Resource identifiers MUST use the documented resource prefixes: PAT, RSV, QUE, VIS, EMR, INV, PAY, EMP, BR, and USR where those resources are implemented.

## Documented API Resources

**API-020** The AI Agent MUST treat the following as documented API examples only and MUST NOT infer additional endpoints from them: `/api/v1/auth/login`, `/api/v1/auth/logout`, `/api/v1/auth/refresh`, `/api/v1/auth/forgot-password`, `/api/v1/auth/reset-password`, `/api/v1/auth/change-password`, `/api/v1/patients`, `/api/v1/reservations`, `/api/v1/queues`, `/api/v1/emr`, `/api/v1/invoices`, `/api/v1/payments`, `/api/v1/items`, `/api/v1/stocks`, `/api/v1/stock-adjustments`, `/api/v1/reports/daily`, `/api/v1/reports/monthly`, and `/api/v1/reports/export`.

**API-021** The AI Agent MUST NOT invent an endpoint that is not present in `09-api-standard.md` or another explicit module SAD.

**API-022** CRUD resources MUST use the documented List `GET`, Detail `GET`, Create `POST`, Replace `PUT`, Update `PATCH`, and Delete `DELETE` operations only where the resource contract defines them.

**API-023** The AI Agent MUST NOT assume that every documented CRUD example exists in the current implementation without implementation evidence.

## HTTP Methods and Status Codes

**API-024** `GET` MUST read a resource and MUST be idempotent.

**API-025** `POST` MUST create a resource or start the documented operation and MUST NOT be assumed idempotent.

**API-026** `PUT` MUST replace a resource and MUST be idempotent.

**API-027** `PATCH` MUST partially update a resource and MUST NOT be assumed idempotent.

**API-028** `DELETE` MUST delete a resource according to the owning module's deletion policy and MUST be idempotent.

**API-029** Successful `GET`, `PUT`, and `PATCH` operations MUST return HTTP `200` unless the endpoint contract explicitly defines another status.

**API-030** Successful `POST` operations MUST return HTTP `201` when a resource is created.

**API-031** Accepted asynchronous operations MUST return HTTP `202`.

**API-032** Successful delete operations MUST return HTTP `204` when no response body is returned.

**API-033** Invalid request format MUST return HTTP `400`.

**API-034** Missing or invalid authentication MUST return HTTP `401`.

**API-035** Missing authorization MUST return HTTP `403`.

**API-036** A missing resource MUST return HTTP `404`.

**API-037** A duplicate resource or conflict MUST return HTTP `409`.

**API-038** Business validation failure MUST return HTTP `422`.

**API-039** Rate-limit exhaustion MUST return HTTP `429`.

**API-040** Unexpected failure MUST return HTTP `500`.

## Content Type and Headers

**API-041** JSON requests MUST send `Content-Type: application/json`.

**API-042** JSON requests MUST send `Accept: application/json`.

**API-043** JSON responses MUST send `Content-Type: application/json`.

**API-044** File uploads MUST use `multipart/form-data`.

**API-045** Protected requests MUST send `Authorization: Bearer <access_token>`.

**API-046** Clients MUST send `X-Correlation-ID` when request tracking is required for logging, audit, tracing, or error investigation; the AI Agent MUST NOT treat its absence as an API validation error when the request does not require tracking.

**API-047** `X-Request-ID` and `Accept-Language` MUST remain optional; the server MUST NOT require them because the SAD marks them Optional.

## Response Schema

**API-048** Every success response MUST contain `success` as boolean `true`, `message` as a string, and `data` as an object or array.

**API-049** A success response MUST treat the `meta` object as optional.

**API-050** A list response MUST return an array in `data`.

**API-051** A delete response MUST return `data: null` when it uses the documented JSON delete envelope.

**API-052** Response data MUST be separated from response metadata under distinct `data` and `meta` properties.

**API-053** Responses MUST NOT return stack traces, database errors, passwords, password hashes, secret keys, internal tokens, refresh tokens except on the refresh endpoint, or unnecessary internal identifiers.

**API-054** The exact endpoint-specific payload fields MUST be taken from the relevant SAD or module contract; otherwise they MUST be treated as `NOT DEFINED IN SAD`.

## Pagination

**API-055** Every collection endpoint MUST support `page` and `limit` query parameters.

**API-056** The default `page` MUST be `1`.

**API-057** The default `limit` MUST be `20`.

**API-058** The maximum `limit` MUST be `100`.

**API-059** Paginated responses MUST place `page`, `limit`, `total`, and `totalPages` in `meta`.

## Filtering and Searching

**API-060** Filtering MUST use query parameters.

**API-061** Multiple filters MUST be represented as multiple query parameters.

**API-062** Date-range filtering MUST use `from` and `to` when the endpoint supports the documented date filter.

**API-063** Searching MUST use the `search` query parameter.

**API-064** Search MUST use case-insensitive partial matching.

**API-065** Search MUST use indexed columns where possible; the AI Agent MUST NOT add an index unless the database contract or measurable requirement defines it.

**API-066** The exact filter fields for each resource MUST be taken from its SAD; undocumented filter fields MUST be treated as `NOT DEFINED IN SAD`.

## Sorting and Field Selection

**API-067** Sorting MUST use `sort` and `order` query parameters.

**API-068** The default sort MUST be `createdAt`.

**API-069** The default order MUST be `desc`.

**API-070** The `order` value MUST be either `asc` or `desc`.

**API-071** The allowed `sort` fields MUST be explicitly defined by the endpoint contract; otherwise they MUST be treated as `NOT DEFINED IN SAD`.

**API-072** Field selection MUST use the comma-separated `fields` query parameter when supported.

**API-073** Requested fields MUST be validated against the endpoint's allowed fields.

**API-074** Sensitive fields MUST NOT be returned through field selection.

**API-075** The default response MUST return the documented standard fields when `fields` is absent.

**API-076** Relation inclusion MUST use the `include` query parameter when supported.

**API-077** Only explicitly allowed relations MUST be included.

**API-078** Include depth MUST NOT exceed two levels.

**API-079** Circular relations MUST NOT be included.

## Error and Validation Responses

**API-080** Every error response MUST contain `success: false`, a string `message`, and an `errors` array.

**API-081** Validation errors MUST use the documented validation response shape with `field` and `message` entries when field-level details exist.

**API-082** Error responses MUST use the standard HTTP status and MUST NOT expose stack traces or database details.

**API-083** Error codes MUST use the documented catalog: `BAD_REQUEST`, `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `CONFLICT`, `VALIDATION_ERROR`, `RATE_LIMIT_EXCEEDED`, and `INTERNAL_SERVER_ERROR` where an error code is returned.

**API-084** Business errors MUST use documented business codes such as `PATIENT_ALREADY_EXISTS`, `PATIENT_NOT_FOUND`, `DOCTOR_NOT_AVAILABLE`, `RESERVATION_CONFLICT`, `EMR_LOCKED`, `INVOICE_ALREADY_PAID`, `PAYMENT_FAILED`, `INSUFFICIENT_STOCK`, and `CLOSING_ALREADY_DONE` only when the corresponding business condition exists.

**API-085** Every request input MUST be validated.

**API-086** The server MUST sanitize requests, reject unknown fields, and validate content type as required by the API security standard.

## Idempotency

**API-087** Payment, refund, invoice generation, closing, and stock adjustment operations MUST support idempotency when implemented.

**API-088** Idempotent operations MUST accept the `Idempotency-Key` header.

**API-089** The server MUST store the idempotency key for an idempotent operation.

**API-090** A repeated request with the same active idempotency key MUST return the same response.

**API-091** The server MUST reject a duplicate request that is still active.

**API-092** The AI Agent MUST treat the exact idempotency storage duration and conflict status as NOT DEFINED IN SAD.

## OpenAPI Compliance

**API-093** The complete REST API MUST be documented using OpenAPI Specification version `3.1`.

**API-094** Every documented endpoint MUST include Summary, Description, Tags, Parameters, Request Body when applicable, Response, Error Response, and Security Requirement.

**API-095** OpenAPI tags MUST group endpoints by module.

**API-096** Every protected endpoint MUST declare the `bearerAuth` security requirement.

**API-097** The exact OpenAPI publication URL MUST be treated as `NOT DEFINED IN SAD`.

## Additional API Operations

**API-098** Batch operations MUST use only the documented `/api/v1/patients/batch`, `/api/v1/payments/batch`, and `/api/v1/invoices/batch-print` examples.

**API-099** Batch requests MUST process no more than 100 records.

**API-100** Batch operations MUST use a transaction when all records are required to succeed.

**API-101** Partial batch failures MUST return failure details.

**API-102** File upload MUST use only the documented `/api/v1/files/upload` endpoint when that capability is implemented.

**API-103** File upload validation MUST check MIME type, extension, and size.

**API-104** File download MUST use authentication, authorization, and audit logging.

**API-105** Long-running report, export, backup, and import operations MUST use asynchronous processing when implemented.

**API-106** Asynchronous acceptance MUST return HTTP `202` and a `jobId` with a documented job status.

**API-107** Webhook endpoints MUST be treated as Future functionality and MUST use HTTPS, signature verification, timestamp validation, and replay protection if implemented.

## Deprecation and Quality

**API-108** Deprecated endpoints MUST NOT be removed immediately.

**API-109** A deprecated endpoint MUST progress through Active, Deprecated, Sunset, and Removed states.

**API-110** Deprecated responses MUST use the documented `Deprecation` and `Sunset` headers when the endpoint is deprecated.

**API-111** API review MUST verify resource naming, URL, method, versioning, DTO, validation, required fields, query parameters, response envelope, status code, security, audit, documentation, and examples.

**API-112** Every endpoint MUST have success, validation, authentication, authorization, not-found, and conflict tests; performance tests MUST be added when required by the endpoint.

**API-113** API performance targets MUST be treated as follows: authentication under 500 ms, CRUD under 300 ms, search under 500 ms, reporting under 2 seconds, and export asynchronous.

**API-114** API implementations MUST use pagination, filtering, sorting, caching where defined, and asynchronous processing for heavy work.

**API-115** Swagger documentation, request examples, response examples, and error documentation MUST be updated with every endpoint change.

See `27-architecture-contract.md` rules `API-*` for the broader architecture contract. Where this file contains a more specific API rule extracted from `09-api-standard.md`, this file MUST be used for API-contract generation.
