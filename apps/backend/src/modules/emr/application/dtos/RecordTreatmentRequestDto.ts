import { IsArray, IsInt, IsOptional, IsString, IsUUID, Max, MaxLength, Min } from 'class-validator';

/**
 * docs/03-sad/15-module-emr.md Section 23 "Material Used" (task-136, Epic
 * Z). Kept as a loosely-typed array rather than `@ValidateNested()` +
 * `@Type()` -- this codebase has no reflect-metadata dependency approved
 * (see RecordTreatmentUseCase's own materials-handling comment); each
 * element's `itemId`/`quantity` shape is validated inside the use case
 * instead, the same discipline already applied elsewhere in this module.
 */
export class RecordTreatmentRequestDto {
  @IsUUID('4') treatmentId!: string;
  @IsOptional() @IsString() @MaxLength(50) toothReference?: string;
  @IsOptional() @IsInt() @Min(1) @Max(100) quantity?: number;
  @IsOptional() @IsString() @MaxLength(1000) notes?: string;
  @IsOptional() @IsArray() materials?: Array<{ itemId: string; quantity: number }>;
}
