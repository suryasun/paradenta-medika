import { AuthenticationException, AuthorizationException, ValidationException } from '../../../../shared/http/exceptions';

/**
 * docs/04-ai-contract/05-auth-contract.md AUTH-044: a failed login response
 * MUST use a generic message and MUST NOT reveal whether the user, password,
 * or lock condition caused the failure. This single exception is used for
 * every login failure branch (user not found, wrong password, inactive,
 * locked) so the client-facing message never varies by cause.
 */
export class InvalidCredentialsException extends AuthenticationException {
  constructor() {
    super('Invalid username/email or password');
  }
}

export class InvalidTokenException extends AuthenticationException {
  constructor(message = 'Invalid or expired token') {
    super(message);
  }
}

export class SessionRevokedException extends AuthenticationException {
  constructor(message = 'Session has been revoked') {
    super(message);
  }
}

export class InsufficientPermissionException extends AuthorizationException {
  constructor(permissionCode: string) {
    super(`Missing required permission: ${permissionCode}`);
  }
}

/**
 * docs/04-ai-contract/05-auth-contract.md AUTH-056 to AUTH-061 password
 * policy violation.
 */
export class PasswordPolicyException extends ValidationException {
  constructor(reasons: string[]) {
    super(
      reasons.map((message) => ({ field: 'password', message })),
      'Password does not meet the required policy',
    );
  }
}
