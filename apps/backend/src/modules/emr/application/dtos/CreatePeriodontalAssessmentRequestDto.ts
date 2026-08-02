import { IsUUID } from 'class-validator';

/**
 * docs/03-sad/15-module-emr.md Part 3.2D Section 39 OpenAPI spec literally
 * includes visitId/patientId/doctorId in the request body -- patientId and
 * doctorId are redundant with the Visit (already carries both), but kept
 * here to match the literal documented contract rather than silently
 * dropping fields, with a server-side check that they match the Visit.
 */
export class CreatePeriodontalAssessmentRequestDto {
  @IsUUID('4') visitId!: string;
  @IsUUID('4') patientId!: string;
  @IsUUID('4') doctorId!: string;
}
