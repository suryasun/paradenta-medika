import { ApplicationException } from './ApplicationException';

export { ApplicationException };

export class ValidationException extends ApplicationException {
  readonly httpStatus = 400;
  readonly code = 'VALIDATION_ERROR';

  constructor(errors: Array<{ field?: string; message: string }>, message = 'Validation failed') {
    super(message, errors);
  }
}

export class AuthenticationException extends ApplicationException {
  readonly httpStatus = 401;
  readonly code = 'UNAUTHORIZED';

  constructor(message = 'Authentication required') {
    super(message);
  }
}

export class AuthorizationException extends ApplicationException {
  readonly httpStatus = 403;
  readonly code: string;

  constructor(message = 'Insufficient permission', code = 'FORBIDDEN') {
    super(message);
    this.code = code;
  }
}

export class NotFoundException extends ApplicationException {
  readonly httpStatus = 404;
  readonly code = 'NOT_FOUND';

  constructor(message = 'Resource not found') {
    super(message);
  }
}

/**
 * `code` defaults to the generic catalog value (API-083) but MAY be
 * overridden with a documented module-specific business code (API-084),
 * e.g. `SYS_USER_IDENTIFIER_EXISTS` (docs/03-sad/21-module-system.md
 * Section 6.4), while still mapping to HTTP 409.
 */
export class ConflictException extends ApplicationException {
  readonly httpStatus = 409;
  readonly code: string;

  constructor(message = 'Resource conflict', code = 'CONFLICT') {
    super(message);
    this.code = code;
  }
}

/**
 * Business rule violation. `code` MUST come from the documented business
 * error catalog (docs/04-ai-contract/04-api-contract.md API-084) when the
 * corresponding business condition exists.
 */
export class BusinessException extends ApplicationException {
  readonly httpStatus = 422;
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

export class ExternalServiceException extends ApplicationException {
  readonly httpStatus = 500;
  readonly code = 'INTERNAL_SERVER_ERROR';

  constructor(message = 'External service failure') {
    super(message);
  }
}

export class InfrastructureException extends ApplicationException {
  readonly httpStatus = 500;
  readonly code = 'INTERNAL_SERVER_ERROR';

  constructor(message = 'Infrastructure failure') {
    super(message);
  }
}
