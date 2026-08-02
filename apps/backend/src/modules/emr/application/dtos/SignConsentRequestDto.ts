import { IsEnum, IsString, MaxLength, MinLength } from 'class-validator';

/** Mirrors Prisma's ConsentSignerRelationship (docs/03-sad/15-module-emr.md Part 3.3D Section 40 "Guardian Support"). */
export enum ConsentSignerRelationshipDto {
  SELF = 'SELF',
  FATHER = 'FATHER',
  MOTHER = 'MOTHER',
  HUSBAND = 'HUSBAND',
  WIFE = 'WIFE',
  LEGAL_GUARDIAN = 'LEGAL_GUARDIAN',
}

/**
 * docs/03-sad/15-module-emr.md Part 3.3D Section 40 "Supported Signature
 * Types" lists Finger/Stylus/Mouse/Uploaded/QR/PKI -- signatureData accepts
 * whatever the capture UI produces (e.g. a data: URL from a canvas draw,
 * or typed text as a minimal fallback), stored as opaque text rather than
 * validated against a specific format, since no single format is mandated.
 */
export class SignConsentRequestDto {
  @IsString() @MinLength(1) @MaxLength(150) signerName!: string;
  @IsEnum(ConsentSignerRelationshipDto) signerRelationship!: ConsentSignerRelationshipDto;
  @IsString() @MinLength(1) signatureData!: string;
}
