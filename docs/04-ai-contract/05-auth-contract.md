# AI Contract 05 - Authentication and Authorization Contract

This contract is extracted only from `10-authentication.md`. The AI Agent MUST NOT add an authentication or authorization behavior that is absent from that document.

## Authentication Architecture

**AUTH-001** Authentication MUST use JWT access tokens and refresh tokens.

**AUTH-002** The authentication pipeline MUST validate credentials, verify the password, generate JWT, generate a refresh token, store a session, return tokens, and authenticate subsequent requests.

**AUTH-003** The authentication components MUST include Login API, JWT Service, Refresh Token Service, Session Service, Password Service, Authorization Middleware, and Audit Service.

**AUTH-004** The backend MUST use stateless access-token authentication and MUST require the authentication information on every authenticated request.

**AUTH-005** The backend MUST track active sessions through refresh-token session management.

**AUTH-006** The identity relationship MUST be User -> Employee -> Role -> Permission where those entities exist.

## JWT Policy

**AUTH-007** The JWT service MUST generate, verify, decode, validate signature, validate expiration, validate claims, and extract user identity.

**AUTH-008** The JWT signing algorithm MUST be HS256.

**AUTH-009** The JWT secret MUST come from an environment variable.

**AUTH-010** The JWT issuer MUST be `Parakita API`.

**AUTH-011** The JWT audience MUST be `Parakita Client`.

**AUTH-012** The access token MUST be signed.

**AUTH-013** The access token MUST NOT contain a password or sensitive data.

**AUTH-014** The JWT MUST contain the claims `sub`, `username`, `role`, `sessionId`, `clinicId`, `iat`, and `exp`.

**AUTH-015** The `sub` claim MUST identify the user.

**AUTH-016** The `role` claim MUST identify the active role.

**AUTH-017** The `sessionId` claim MUST identify the login session.

**AUTH-018** The `iat` claim MUST identify token issuance time.

**AUTH-019** The `exp` claim MUST identify token expiration time.

## Expiration and Token Storage

**AUTH-020** The access token lifetime MUST be 15 minutes by default.

**AUTH-021** The refresh token lifetime MUST be 30 days by default.

**AUTH-022** The access token MUST NOT be stored in the database.

**AUTH-023** The refresh token MUST be stored in the database.

**AUTH-024** The database MUST store the refresh-token hash rather than the plaintext refresh token.

**AUTH-025** The refresh token MUST be revocable.

**AUTH-026** The refresh token MUST be device-bound.

**AUTH-027** The client-side access-token storage mechanism MUST be treated as NOT DEFINED IN SAD.

**AUTH-028** The exact JWT secret length, environment-variable name, and client storage technology MUST be treated as NOT DEFINED IN SAD unless defined by another explicit contract.

## Refresh Token Policy

**AUTH-029** The refresh-token service MUST generate, rotate, revoke, and validate refresh tokens.

**AUTH-030** A refresh request MUST validate session status, user status, device status, expiration, and refresh-token hash.

**AUTH-031** Every successful refresh MUST generate a new access token and a new refresh token.

**AUTH-032** The old refresh token MUST be revoked before the new refresh token is stored.

**AUTH-033** The new refresh-token hash MUST be stored with the session.

**AUTH-034** Refresh-token reuse after revocation MUST immediately disable the session.

**AUTH-035** Refresh-token reuse MUST revoke all refresh tokens belonging to the affected session.

**AUTH-036** Refresh-token reuse MUST create a security audit event.

**AUTH-037** Refresh-token reuse MUST require the user to log in again.

## Login Flow

**AUTH-038** Login MUST accept username or email as the login identifier.

**AUTH-039** Login MUST find the user, verify the password, verify active status, verify active role, and verify that the account is not locked.

**AUTH-040** A successful login MUST generate an access token, generate a refresh token, create a session, and return tokens to the client.

**AUTH-041** A successful login response MUST include access token, refresh token, expiration time, user profile, role, and permission summary.

**AUTH-042** A failed login MUST increment the failed-login counter.

**AUTH-043** A failed login MUST create an audit login event.

**AUTH-044** A failed login response MUST use a generic message and MUST NOT reveal whether the user, password, or lock condition caused the failure.

## Logout Flow

**AUTH-045** Logout MUST revoke the session.

**AUTH-046** Logout MUST revoke the refresh token.

**AUTH-047** Logout MUST record a logout activity in the Audit Trail.

**AUTH-048** The access token MUST be allowed to expire naturally after logout because the SAD does not define access-token blacklist storage.

**AUTH-049** Administrator force logout MUST support revoking all devices, a selected device, or all sessions for a user as defined by the authorization scope.

## Session Management

**AUTH-050** The session service MUST manage active sessions, device information, login time, logout, and session revocation.

**AUTH-051** A session record MUST support session ID, user ID, device ID, device name, device type, operating system, browser, IP address, login time, last activity, expiration, revoked time, and active/revoked status where the corresponding session table fields exist.

**AUTH-052** A user MUST be allowed to have multiple active sessions.

**AUTH-053** Each active device session MUST have its own refresh token.

**AUTH-054** A session MUST be revoked on logout, password change, administrator revocation, refresh-token expiration, user suspension, or refresh-token reuse detection.

**AUTH-055** Every authenticated request MUST validate the JWT, active session, active user, active role, and required permission before business execution.

## Password Policy

**AUTH-056** Passwords MUST have a minimum length of 8 characters.

**AUTH-057** Passwords MUST have a maximum length of 64 characters.

**AUTH-058** Passwords MUST contain an uppercase character, lowercase character, number, and special character.

**AUTH-059** A password MUST NOT equal the username or email.

**AUTH-060** A password MUST NOT contain the user's name.

**AUTH-061** A password MUST NOT be a common password such as `123456`, `password`, or `admin`.

**AUTH-062** Password expiration MUST be disabled by default.

**AUTH-063** Password expiration MUST only be enabled through the documented system configuration.

**AUTH-064** Passwords MUST be hashed using bcrypt by default.

**AUTH-065** The default password salt-round configuration MUST be 12 where the authentication environment configuration applies.

**AUTH-066** Plaintext passwords MUST NOT be stored, logged, or returned to the client.

**AUTH-067** Password hashes MUST NOT be returned to the client.

## Account Lock and Password Reset

**AUTH-068** The documented default login protection MUST lock an account after 5 failed attempts for 15 minutes.

**AUTH-069** The documented default login protection MUST require password reset after 10 failed attempts.

**AUTH-070** Twenty failed attempts MUST require administrator review where the documented brute-force strategy applies.

**AUTH-071** The exact configurable lock-policy override MUST be treated as NOT DEFINED IN SAD.

**AUTH-072** A password-reset token MUST be single-use.

**AUTH-073** A password-reset token MUST have an expiration time.

**AUTH-074** A password change MUST revoke all old sessions.

**AUTH-075** A password reset MUST revoke all old sessions.

**AUTH-076** Password-change and password-reset activities MUST be recorded in the Audit Trail.

## RBAC and Role Hierarchy

**RBAC-001** Authorization MUST use Role Based Access Control after authentication.

**RBAC-002** Authorization MUST apply Least Privilege, Explicit Permission, Deny by Default, RBAC, and Resource Level Authorization.

**RBAC-003** Authorization MUST validate JWT, load user, load role, load permissions, check permission, and then execute the Controller.

**RBAC-004** The standard roles MUST include Owner, Clinic Manager, Administrator, Registration, Doctor, Nurse, Cashier, Warehouse, Finance, and HR.

**RBAC-005** The role hierarchy MUST be represented as Owner -> Clinic Manager -> Administrator -> Doctor -> Nurse -> Registration -> Cashier -> Warehouse -> Finance -> HR for responsibility illustration.

**RBAC-006** The role hierarchy MUST NOT automatically inherit permissions because the SAD states that roles are independent.

**RBAC-007** The exact role-to-permission matrix MUST be treated as defined only where explicitly listed in the SAD.

## Permission Naming and Evaluation

**RBAC-008** Permission codes MUST use the `module.action` format.

**RBAC-009** Permission actions MUST use the documented actions View, Create, Update, Delete, Approve, Cancel, Void, Print, Export, and Closing where applicable.

**RBAC-010** Permission evaluation MUST validate role and permission before Controller execution.

**RBAC-011** Dynamic authorization MUST evaluate business rules, resource rules, active visit/invoice/queue conditions, and active clinic conditions where those rules apply.

**RBAC-012** Resource ownership MUST be validated for resources that require ownership.

**RBAC-013** Doctor EMR access MUST validate assigned-doctor ownership where the documented EMR ownership rule applies.

**RBAC-014** Permission cache MUST include role, permission list, menu, and API permission when caching is implemented.

**RBAC-015** Permission cache MUST be invalidated when role changes, permission changes, user-role assignment changes, or login occurs.

**RBAC-016** Permission cache storage technology MUST be treated as NOT DEFINED IN SAD; Redis is only identified as a Future Enhancement.

## MFA and Future Authentication

**AUTH-077** MFA MUST be treated as Future functionality because the SAD excludes MFA from the current scope.

**AUTH-078** The AI Agent MUST NOT implement MFA, OAuth, SSO, LDAP, or social login without an updated SAD decision.

**AUTH-079** The exact MFA factor, enrollment flow, challenge flow, recovery flow, and enforcement policy MUST be treated as NOT DEFINED IN SAD.

## Forbidden and Failure Responses

**AUTH-080** A missing token MUST return HTTP `401`.

**AUTH-081** An invalid token MUST return HTTP `401`.

**AUTH-082** An expired token MUST return HTTP `401`.

**AUTH-083** A revoked session MUST return HTTP `401`.

**AUTH-084** An inactive user MUST return HTTP `401`.

**AUTH-085** A missing permission MUST return HTTP `403`.

**AUTH-086** Authorization denial MUST record an audit event.

**AUTH-087** Authorization denial MUST NOT execute business logic.

**AUTH-088** Security failure responses MUST use the standard error envelope with `success: false`, `message`, and `errors`.

**AUTH-089** Security error responses MUST NOT reveal password validity, user existence, JWT secret, stack trace, or SQL error.

## Security Audit and Configuration

**AUTH-090** Security audit events MUST include timestamp, event type, user ID, session ID, IP address, user agent, result, and description where those fields exist.

**AUTH-091** Login success, login failure, logout, token refresh, permission denial, password change, password reset, session revocation, account lock, force logout, role change, and permission change MUST be auditable.

**AUTH-092** Authentication security configuration MUST be provided through environment variables and MUST NOT be hardcoded.

**AUTH-093** The documented authentication environment configuration MUST include JWT secret, access expiration, refresh expiration, password salt rounds, login maximum attempts, account lock minutes, and session timeout where those settings are used.

**AUTH-094** The exact environment-variable names for every setting MUST be treated as NOT DEFINED IN SAD except where the SAD explicitly names them.

See `27-architecture-contract.md` rules `AUTH-*` and `RBAC-*` for the broader architecture contract. This file MUST be used for Authentication and Authorization contract generation.
