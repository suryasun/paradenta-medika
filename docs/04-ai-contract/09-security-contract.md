# AI Contract 09 - Security Contract

This contract is extracted only from `25-security.md`. The AI Agent MUST NOT add a security control, exception, threshold, encryption algorithm, retention period, or operational behavior that is absent from that document.

## Security Principles and OWASP Controls

**SEC-001** Every module MUST follow Security by Design, Secure by Default, Defense in Depth, Zero Trust, Least Privilege, Privacy by Design, Fail Secure, and Immutable Audit Trail principles.

**SEC-002** Every trust boundary MUST use the authentication and authorization mechanism required for that boundary.

**SEC-003** The security architecture MUST protect confidentiality, integrity, availability, accountability, and auditability.

**SEC-004** The application MUST implement the documented OWASP Top 10 2021 mitigations.

**SEC-005** Broken access control MUST be mitigated with JWT, RBAC, branch isolation, and row-level controls.

**SEC-006** Cryptographic failures MUST be mitigated with TLS, bcrypt, and encryption controls defined by SAD.

**SEC-007** Injection MUST be mitigated with parameterized queries, ORM protections, and input validation.

**SEC-008** Insecure design MUST be mitigated through Security by Design and threat modeling.

**SEC-009** Security misconfiguration MUST be mitigated through hardened configuration and environment separation.

**SEC-010** Vulnerable components MUST be mitigated with dependency scanning and patch management.

**SEC-011** Identification and authentication failures MUST be mitigated with JWT and session management.

**SEC-012** Software and data integrity failures MUST be mitigated with signed builds and CI/CD validation where those controls are implemented.

**SEC-013** Security logging failures MUST be mitigated with centralized audit and security logging.

**SEC-014** SSRF MUST be mitigated with URL validation and network restriction where outbound URL handling exists.

**SEC-015** The exact signed-build technology, SSRF allowlist, and CI/CD security implementation MUST be treated as NOT DEFINED IN SAD.

## Secure Development Lifecycle

**SEC-016** Secure development MUST follow Requirement -> Architecture Review -> Threat Modeling -> Secure Coding -> Code Review -> Security Testing -> Deployment -> Monitoring.

**SEC-017** Planning MUST include security requirements.

**SEC-018** Design MUST include threat modeling.

**SEC-019** Development MUST use secure coding.

**SEC-020** Testing MUST include SAST and DAST where the corresponding test phase applies.

**SEC-021** Deployment MUST apply security configuration.

**SEC-022** Operation MUST include monitoring and patching.

**SEC-023** Security controls MUST be regression-tested after feature release, bug fix, framework upgrade, dependency upgrade, or configuration change.

## Input Validation and Sanitization

**SEC-024** Every client and API request input MUST be validated.

**SEC-025** Backend request validation MUST use DTO validation with `class-validator` as specified by `25-security.md`.

**SEC-026** Input validation MUST include UUID validation, enum validation, string length, numeric range, date validation, and required-field validation where the field type applies.

**SEC-027** Technical validation MUST run before business validation.

**SEC-028** Business validation MUST run before Application Service processing.

**SEC-029** Input sanitization MUST trim whitespace.

**SEC-030** Input sanitization MUST normalize Unicode characters when required by the input context.

**SEC-031** Input sanitization MUST reject invalid control characters.

**SEC-032** Input sanitization MUST validate input length and format.

**SEC-033** Search keywords, patient names, notes, doctor notes, invoice remarks, and EMR narratives MUST pass the defined sanitization and validation pipeline.

**SEC-034** Client-side validation MUST NOT replace server-side validation.

**SEC-035** Unknown or invalid input MUST fail securely and MUST NOT reach business processing.

## Output Encoding and XSS Prevention

**SEC-036** Output MUST be encoded according to its destination context.

**SEC-037** HTML output MUST use HTML encoding.

**SEC-038** JSON output MUST use JSON serialization.

**SEC-039** URL output MUST use URL encoding.

**SEC-040** HTML attribute output MUST use attribute encoding.

**SEC-041** The application MUST implement output encoding to mitigate XSS.

**SEC-042** API responses MUST NOT include stack traces, SQL queries, secrets, or internal server paths.

**SEC-043** Error responses MUST use the standard error response format.

## SQL Injection and Other Injection Prevention

**SEC-044** SQL access MUST use Prisma ORM, parameterized queries, or a query builder with parameter binding.

**SEC-045** SQL query string concatenation with untrusted input MUST NOT be used.

**SEC-046** All SQL-bound input MUST be validated before query execution.

**SEC-047** Command execution MUST NOT be used when it is not required by the defined capability.

**SEC-048** Command parameters MUST use a whitelist when command execution is required.

**SEC-049** Command input MUST be validated before execution.

**SEC-050** Future NoSQL access MUST use an official driver, validate data types, and reject disallowed operators if NoSQL is introduced.

**SEC-051** LDAP and XPath injection inputs MUST use the documented escaping or parameter validation controls when those integrations exist.

## File Upload Security

**SEC-052** File upload input MUST validate MIME type, file extension, and file size.

**SEC-053** Uploaded file names MUST use a random UUID name.

**SEC-054** Uploaded files MUST be stored outside a public directory where possible.

**SEC-055** Upload processing MUST follow Validate Size -> Validate MIME Type -> Virus Scan where implemented -> Store File -> Audit Log.

**SEC-056** The exact virus-scanning technology MUST be treated as NOT DEFINED IN SAD because virus scanning is marked Future.

## CSRF Policy

**SEC-057** Bearer-token authentication MUST NOT require CSRF protection under the documented policy.

**SEC-058** HttpOnly-cookie authentication MUST enable CSRF protection.

**SEC-059** Cookie-based CSRF protection MUST use SameSite Cookie, CSRF Token, Origin Validation, and Referer Validation controls defined by SAD.

**SEC-060** The exact cookie configuration and CSRF token implementation MUST be treated as NOT DEFINED IN SAD.

## CORS Policy

**SEC-061** CORS MUST be explicitly configured.

**SEC-062** Production CORS origins MUST use an explicit whitelist.

**SEC-063** Production CORS MUST NOT use wildcard origin.

**SEC-064** CORS methods MUST be limited to the documented GET, POST, PUT, PATCH, DELETE, and OPTIONS methods where those methods are enabled.

**SEC-065** CORS headers MUST be limited to the documented Authorization, Content-Type, Accept, X-Correlation-ID, and Idempotency-Key headers where those headers are used.

**SEC-066** CORS credentials MUST be enabled only when required by the configured authentication mechanism.

**SEC-067** The exact production origin whitelist MUST be treated as NOT DEFINED IN SAD; the listed `app`, `admin`, and `mobile` origins are documented examples.

## Rate Limiting

**SEC-068** Login requests MUST be limited to 5 requests per minute per IP under the documented default API security policy.

**SEC-069** Refresh-token requests MUST be limited to 20 requests per minute under the documented default API security policy.

**SEC-070** Search requests MUST be limited to 100 requests per minute under the documented default API security policy.

**SEC-071** Standard API requests MUST be limited to 300 requests per minute under the documented default API security policy.

**SEC-072** File-upload requests MUST be limited to 20 requests per minute under the documented default API security policy.

**SEC-073** Rate limiting MUST support IP-based, user-based, endpoint-based, and burst protection controls where implemented.

**SEC-074** A rate-limit breach MUST return HTTP `429 Too Many Requests`.

**SEC-075** The exact rate-limit storage and distributed-counter implementation MUST be treated as NOT DEFINED IN SAD.

## TLS and Secure Communication

**SEC-076** Production communication MUST use HTTPS.

**SEC-077** Production TLS MUST use TLS 1.2 or higher.

**SEC-078** TLS 1.3 MUST be treated as the recommended protocol version where supported.

**SEC-079** Production HTTP traffic MUST redirect to HTTPS.

**SEC-080** Production HSTS MUST be enabled.

**SEC-081** Production certificates MUST be issued by a trusted Certificate Authority.

**SEC-082** Self-signed certificates MUST be restricted to Development.

**SEC-083** Legacy or weak TLS ciphers MUST be disabled.

**SEC-084** Browser-to-API communication MUST use HTTPS.

**SEC-085** Backup transfers MUST use encrypted communication.

**SEC-086** API-to-database communication MUST use an internal secure network and MUST use TLS where configured by the database security policy.

## Security Headers

**SEC-087** Every HTTP response MUST include the security headers defined by SAD.

**SEC-088** Responses MUST include Strict-Transport-Security for HTTPS enforcement.

**SEC-089** Responses MUST include Content-Security-Policy for XSS mitigation.

**SEC-090** Responses MUST include X-Frame-Options for clickjacking protection.

**SEC-091** Responses MUST include X-Content-Type-Options for MIME-sniffing protection.

**SEC-092** Responses MUST include Referrer-Policy for referrer restriction.

**SEC-093** Responses MUST include Permissions-Policy for browser-feature restriction.

**SEC-094** The exact header values outside the examples in SAD MUST be treated as NOT DEFINED IN SAD.

## Audit Log and Security Logging

**SEC-095** Important user, authentication, authorization, API, database, and security activities MUST be logged.

**SEC-096** Audit records MUST be immutable, timestamped, traceable, tamper-evident, centralized, and access-controlled.

**SEC-097** Audit logs MUST record user, branch, IP address, device, timestamp, and action where those fields apply.

**SEC-098** Security logs MUST record login success, login failure, logout, password change, password reset, JWT validation failure, permission denial, account lock, session revocation, and suspicious activity.

**SEC-099** Authorization logs MUST record permission granted, permission denied, branch validation failure, unauthorized access, approval granted, and approval rejected.

**SEC-100** API logs MUST record timestamp, HTTP method, endpoint, user ID, session ID, response code, response time, and IP address.

**SEC-101** Database audit logs MUST record INSERT, UPDATE, soft DELETE, and APPROVAL for audited tables.

**SEC-102** API logs MUST NOT store passwords, JWT tokens, refresh tokens, secrets, credit information, or complete medical narratives.

**SEC-103** Audit logs MUST NOT be manually deleted or modified after storage.

**SEC-104** Access to audit and security logs MUST itself be logged.

**SEC-105** Centralized logging MUST support the documented SIEM-ready source categories when SIEM integration is implemented.

**SEC-106** Security log retention MUST be 7 years, application log retention MUST be 1 year, and access log retention MUST be 1 year according to the documented policy.

**SEC-107** Audit log retention MUST be permanent.

**SEC-108** Log encryption, hash verification, collector technology, SIEM product, and alert thresholds not explicitly defined by SAD MUST be treated as NOT DEFINED IN SAD.

## PII and Sensitive Data Protection

**SEC-109** Data MUST be classified as Public, Internal, Confidential, or Restricted according to the Data Security classification.

**SEC-110** Patient profile data MUST be treated as Confidential.

**SEC-111** Medical records, prescriptions, user credentials, refresh tokens, and audit logs MUST be treated as Restricted.

**SEC-112** Billing and Finance data MUST be treated as Confidential.

**SEC-113** Patient name, national ID, passport number, phone, email, home address, date of birth, and emergency contact MUST be treated as PII.

**SEC-114** PII MUST be shown only to authorised users.

**SEC-115** PII MUST NOT be written to application logs.

**SEC-116** PII MUST NOT be sent to a third-party service without appropriate authorization.

**SEC-117** PII MUST NOT be placed in URL paths.

**SEC-118** Sensitive data MUST use RBAC, TLS, audit trail, encryption, and masking controls according to its classification.

**SEC-119** Masking MUST be used in UI and reports where the user authorization does not permit full data.

**SEC-120** Masking MUST NOT alter the stored source data.

**SEC-121** The exact masking algorithm and field-level access matrix MUST be treated as NOT DEFINED IN SAD.

## Encryption and Secret Management

**SEC-122** Production database storage MUST use encryption at rest.

**SEC-123** Database disks MUST use full-disk encryption.

**SEC-124** Backups MUST use AES-256 encryption.

**SEC-125** File storage MUST use server-side encryption.

**SEC-126** Secret storage MUST use secret management.

**SEC-127** JWT secret, refresh-token secret, database password, SMTP password, storage credential, API key, and encryption key MUST be managed as secrets.

**SEC-128** Secrets MUST be provided through environment variables or secret-management infrastructure.

**SEC-129** Secrets MUST NOT be hardcoded, committed to Git, sent by email, logged, or embedded in container images.

**SEC-130** Production secrets MUST use Secret Management rather than a local `.env` file.

**SEC-131** Secrets MUST be separated by environment.

**SEC-132** Secrets MUST be rotated periodically.

**SEC-133** The exact secret-rotation schedule, encryption key-management service, and field-level encryption algorithm MUST be treated as NOT DEFINED IN SAD.

## Database and Infrastructure Controls

**SEC-134** The database MUST NOT be directly accessible from the Internet.

**SEC-135** Only the Application Server MUST be allowed to connect to the database.

**SEC-136** Database accounts MUST use least privilege.

**SEC-137** Database access MUST use separate privilege scopes for Application, Migration, Read Only, and Administrator accounts where those accounts are implemented.

**SEC-138** Network security MUST use default deny.

**SEC-139** Only required ports MUST be exposed.

**SEC-140** Internal communication MUST use private networking.

**SEC-141** Production servers MUST be hardened with supported OS, security patches, disabled unused services, SSH keys, disabled root SSH login, least-privilege system accounts, NTP synchronization, and system audit logging.

**SEC-142** Production containers MUST use verified images, non-root users, isolated networks, separate persistent volumes, capability restrictions, restart policy, vulnerability scanning, and fixed image tags.

**SEC-143** The exact firewall source allowlists, SSH port, idle timeout, container resource limits, and capability list MUST be treated as NOT DEFINED IN SAD.

## Backup and Retention Policy

**SEC-144** Backup scope MUST include database, uploaded files, configuration, and audit logs.

**SEC-145** Backups MUST be performed daily.

**SEC-146** Backups MUST be encrypted.

**SEC-147** Backups MUST be tested periodically.

**SEC-148** Backup copies MUST be stored in a separate location.

**SEC-149** Backup access MUST be restricted by access control.

**SEC-150** Daily backups MUST be retained for 30 days.

**SEC-151** Weekly backups MUST be retained for 12 weeks.

**SEC-152** Monthly backups MUST be retained for 12 months.

**SEC-153** Yearly backups MUST be retained for 7 years.

**SEC-154** Medical records, patient profiles, billing, and audit logs MUST be retained permanently according to the documented retention policy.

**SEC-155** Login history MUST be retained for 2 years.

**SEC-156** System logs MUST be retained for 1 year.

**SEC-157** Data required by regulation MUST NOT be deleted.

**SEC-158** Secure deletion MUST use authorization, soft delete where applicable, audit logging, and retention-policy validation.

## Security Testing and Incident Response

**SEC-159** Security testing MUST be integrated into the Secure SDLC.

**SEC-160** SAST MUST scan API, Domain, Infrastructure code, configuration, and Dockerfiles.

**SEC-161** DAST MUST test login, REST API, file upload, session management, and error handling.

**SEC-162** Dependency scans MUST include npm audit, known CVE review, deprecated-package review, and license review where applicable.

**SEC-163** Docker image scanning MUST verify base image, CVEs, package updates, and non-root execution.

**SEC-164** Authentication and authorization testing MUST cover valid/invalid login, expired JWT, revoked session, locked account, refresh token, multiple login, session expiration, branch access, missing permission, invalid role, and resource ownership.

**SEC-165** Vulnerability remediation MUST follow Critical <= 24 hours, High <= 7 days, Medium <= 30 days, and Low scheduled maintenance.

**SEC-166** Incident response MUST follow Preparation -> Detection -> Analysis -> Containment -> Eradication -> Recovery -> Post Incident Review.

**SEC-167** Critical incidents MUST receive response within 30 minutes, High within 1 hour, Medium within 4 hours, and Low within 1 day according to the incident policy.

**SEC-168** Credential compromise MUST trigger account lock, session revocation, forced password reset, audit review, and login-source verification.

**SEC-169** SQL injection attempts MUST trigger request blocking, API-log review, database-integrity verification, vulnerability patching, and repeat-attack monitoring.

**SEC-170** Malware detection MUST trigger host isolation, evidence preservation, system scan, clean-backup restoration, and controlled service resumption.

**SEC-171** Data leakage MUST trigger access disablement, evidence preservation, impact assessment, management notification, and corrective action.

**SEC-172** Evidence MUST preserve timestamps, chain of custody, read-only storage, backup evidence, and access restriction.

See `27-architecture-contract.md` rules `SEC-*` and `LOG-*` for the broader architecture contract. This file MUST be used for Security contract generation.
