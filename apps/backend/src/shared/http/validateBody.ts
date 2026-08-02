import { NextFunction, Request, RequestHandler, Response } from 'express';
import { plainToInstance } from 'class-transformer';
import { validate, ValidatorOptions } from 'class-validator';
import { ValidationException } from './exceptions';

/**
 * docs/04-ai-contract/09-security-contract.md SEC-025: request validation
 * MUST use DTO validation with class-validator. SEC-086: unknown fields MUST
 * be rejected (forbidNonWhitelisted).
 */
export function validateBody<T extends object>(dtoClass: new () => T): RequestHandler {
  const options: ValidatorOptions = { whitelist: true, forbidNonWhitelisted: true };

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const instance = plainToInstance(dtoClass, req.body ?? {});
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

    req.body = instance;
    next();
  };
}
