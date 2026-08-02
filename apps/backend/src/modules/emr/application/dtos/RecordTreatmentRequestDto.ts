import { IsInt, IsOptional, IsString, IsUUID, Max, MaxLength, Min } from 'class-validator';

export class RecordTreatmentRequestDto {
  @IsUUID('4') treatmentId!: string;
  @IsOptional() @IsString() @MaxLength(50) toothReference?: string;
  @IsOptional() @IsInt() @Min(1) @Max(100) quantity?: number;
  @IsOptional() @IsString() @MaxLength(1000) notes?: string;
}
