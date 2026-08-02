import { IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

/** docs/06-tasks/task-086.md: literal endpoint is a flat POST /api/v1/emr/consents (not nested under a Visit path), so visitId is a body field. */
export class CreateConsentRequestDto {
  @IsUUID('4') visitId!: string;
  @IsUUID('4') templateId!: string;
  @IsString() @MinLength(1) @MaxLength(200) procedure!: string;
}
