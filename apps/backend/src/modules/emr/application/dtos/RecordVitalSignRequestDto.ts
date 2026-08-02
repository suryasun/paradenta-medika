import { IsInt, IsNumber, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

/** Fields per docs/03-sad/15-module-emr.md Section 17 Vital Sign Data. */
export class RecordVitalSignRequestDto {
  @IsOptional() @IsString() @MaxLength(20) bloodPressure?: string;
  @IsOptional() @IsInt() @Min(0) @Max(300) heartRate?: number;
  @IsOptional() @IsInt() @Min(0) @Max(120) respiratoryRate?: number;
  @IsOptional() @IsNumber() @Min(20) @Max(45) temperature?: number;
  @IsOptional() @IsNumber() @Min(0) @Max(500) weight?: number;
  @IsOptional() @IsNumber() @Min(0) @Max(300) height?: number;
  @IsOptional() @IsInt() @Min(0) @Max(100) oxygenSaturation?: number;
}
