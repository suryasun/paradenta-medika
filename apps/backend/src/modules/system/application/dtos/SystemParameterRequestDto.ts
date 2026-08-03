import { IsBoolean, IsDateString, IsDefined, IsIn, IsObject, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

const VALUE_TYPES = ['STRING', 'INTEGER', 'DECIMAL', 'BOOLEAN', 'ENUM', 'DATE', 'DURATION', 'JSON', 'SECRET_REF'] as const;
const SCOPE_TYPES = ['GLOBAL', 'BRANCH'] as const;

/**
 * docs/03-sad/21-module-system.md Section 6.2 "Parameter proposal
 * example": `scope` is a nested `{ type, id }` object and `value` is a
 * raw typed JSON value (e.g. the literal integer `30`), not always a
 * string. `scope`/`value` stay loosely typed here (`@IsObject()`, no
 * value-shape constraint) rather than `@ValidateNested()/@Type()`
 * (requires the `reflect-metadata` polyfill, not an approved dependency
 * -- see CreatePaymentRequestDto.ts's prior note on this constraint);
 * SystemParameterValueValidator does the actual typed-schema check
 * inside the use case.
 */
export class CreateSystemParameterRequestDto {
  @IsString() @MinLength(1) @MaxLength(150) key!: string;
  @IsOptional() @IsObject() scope?: { type?: string; id?: string };
  @IsIn(VALUE_TYPES) valueType!: (typeof VALUE_TYPES)[number];
  @IsDefined() value: unknown;
  @IsOptional() @IsDateString() effectiveFrom?: string;
  @IsOptional() @IsBoolean() isHighRisk?: boolean;
  @IsOptional() @IsString() reason?: string;
}

export { VALUE_TYPES, SCOPE_TYPES };
