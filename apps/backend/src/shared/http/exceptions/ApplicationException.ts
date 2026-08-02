/**
 * Root of the exception hierarchy mandated by
 * docs/03-sad/03-clean-architecture.md Section 38.2.
 */
export abstract class ApplicationException extends Error {
  abstract readonly httpStatus: number;
  abstract readonly code: string;
  readonly errors: Array<{ field?: string; message: string }>;

  protected constructor(message: string, errors: Array<{ field?: string; message: string }> = []) {
    super(message);
    this.name = new.target.name;
    this.errors = errors;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
