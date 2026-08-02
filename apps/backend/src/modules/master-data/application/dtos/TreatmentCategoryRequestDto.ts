import { IsBoolean, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateTreatmentCategoryRequestDto {
  @IsString() @MinLength(2) @MaxLength(30) categoryCode!: string;
  @IsString() @MinLength(2) @MaxLength(100) categoryName!: string;
}

export class UpdateTreatmentCategoryRequestDto {
  @IsOptional() @IsString() @MinLength(2) @MaxLength(100) categoryName?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
}
