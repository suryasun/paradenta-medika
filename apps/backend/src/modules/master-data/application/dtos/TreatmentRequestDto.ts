import { IsBoolean, IsInt, IsNumber, IsOptional, IsString, IsUUID, Min, MaxLength, MinLength } from 'class-validator';

export class CreateTreatmentRequestDto {
  @IsString() @MinLength(2) @MaxLength(30) treatmentCode!: string;
  @IsString() @MinLength(2) @MaxLength(200) treatmentName!: string;
  @IsUUID('4') treatmentCategoryId!: string;
  @IsOptional() @IsInt() @Min(1) durationMinute?: number;
  @IsNumber() @Min(0) defaultPrice!: number;
  @IsOptional() @IsNumber() @Min(0) doctorFee?: number;
}

export class UpdateTreatmentRequestDto {
  @IsOptional() @IsString() @MinLength(2) @MaxLength(200) treatmentName?: string;
  @IsOptional() @IsUUID('4') treatmentCategoryId?: string;
  @IsOptional() @IsInt() @Min(1) durationMinute?: number;
  @IsOptional() @IsNumber() @Min(0) defaultPrice?: number;
  @IsOptional() @IsNumber() @Min(0) doctorFee?: number;
  @IsOptional() @IsBoolean() isActive?: boolean;
}
