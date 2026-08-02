import { IsEnum, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

/** Mirrors task-078's own literal Backend Scope category list (not Part 3.3A Section 5's fuller nested taxonomy). */
export enum AttachmentCategoryDto {
  CLINICAL_PHOTOGRAPHY = 'CLINICAL_PHOTOGRAPHY',
  X_RAY = 'X_RAY',
  CBCT = 'CBCT',
  CONSENT = 'CONSENT',
  PDF = 'PDF',
  VIDEO = 'VIDEO',
  OTHER = 'OTHER',
}

/**
 * Text fields of the multipart/form-data body per docs/03-sad/15-module-
 * emr.md Section 60 OpenAPI spec (patientId/visitId/category/
 * attachmentType/file) -- `file` itself arrives as `req.file` via multer,
 * not through this DTO. `attachmentId` is an extension beyond the literal
 * spec (flagged): when present, the upload is treated as a "correction"
 * re-upload adding a new version to that existing attachment (task-078 AC)
 * rather than creating a new one, since the SAD's multipart field list
 * doesn't show a separate endpoint for that case.
 */
export class UploadAttachmentRequestDto {
  @IsUUID('4') visitId!: string;
  @IsUUID('4') patientId!: string;
  @IsEnum(AttachmentCategoryDto) category!: AttachmentCategoryDto;
  @IsOptional() @IsString() @MaxLength(100) attachmentType?: string;
  @IsOptional() @IsUUID('4') attachmentId?: string;
}
