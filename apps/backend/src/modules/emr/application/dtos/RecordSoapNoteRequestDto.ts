import { IsOptional, IsString, MaxLength } from 'class-validator';

/** Fields per docs/03-sad/15-module-emr.md Section 16 SOAP Note. */
export class RecordSoapNoteRequestDto {
  @IsOptional() @IsString() @MaxLength(4000) subjective?: string;
  @IsOptional() @IsString() @MaxLength(4000) objective?: string;
  @IsOptional() @IsString() @MaxLength(4000) assessment?: string;
  @IsOptional() @IsString() @MaxLength(4000) plan?: string;
}
