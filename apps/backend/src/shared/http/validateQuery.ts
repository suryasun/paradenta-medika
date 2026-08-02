import { NextFunction, Request, RequestHandler, Response } from 'express';
import { plainToInstance } from 'class-transformer';
import { validate, ValidatorOptions } from 'class-validator';
import { ValidationException } from './exceptions';

/**
 * Same validation contract as validateBody (docs/04-ai-contract/09-security-contract.md
 * SEC-025/SEC-086), applied to query parameters for list endpoints.
 */
export function validateQuery<T extends object>(dtoClass: new () => T): RequestHandler {
  const options: ValidatorOptions = { whitelist: true, forbidNonWhitelisted: true };

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const instance = plainToInstance(dtoClass, req.query ?? {});
    const violations = await validate(instance, options);

    if (violations.length > 0) {
      const errors = violations.flatMap((violation) =>
        Object.values(violation.constraints ?? {}).map((message) => ({
          field: violation.property,
          message,
        })),
      );
      next(new ValidationException(errors));
      return;
    }

    req.query = instance as unknown as Request['query'];
    next();
  };
}
