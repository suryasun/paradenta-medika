import { IsBoolean, IsEnum, IsIn, IsInt, IsNumber, IsOptional, Max, Min } from 'class-validator';
import { PeriodontalMeasurementPointDto } from './SaveMeasurementRequestDto';

const FURCATION_GRADES = ['0', 'I', 'II', 'III'] as const;

export class UpdateMeasurementRequestDto {
  @IsOptional() @IsInt() toothNumber?: number;

  @IsOptional() @IsEnum(PeriodontalMeasurementPointDto) measurementPoint?: PeriodontalMeasurementPointDto;

  @IsOptional() @IsNumber({ maxDecimalPlaces: 1 }) @Min(0) @Max(15) pocketDepth?: number;

  @IsOptional() @IsNumber({ maxDecimalPlaces: 1 }) @Min(-10) @Max(10) gingivalMargin?: number;

  @IsOptional() @IsBoolean() bleeding?: boolean;

  @IsOptional() @IsInt() @Min(0) @Max(3) plaqueIndex?: number;

  @IsOptional() @IsInt() @Min(0) @Max(3) mobility?: number;

  @IsOptional() @IsIn(FURCATION_GRADES) furcation?: (typeof FURCATION_GRADES)[number];
}
