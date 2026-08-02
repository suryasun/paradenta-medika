import { IsBoolean, IsEnum, IsIn, IsInt, IsNumber, IsOptional, Max, Min } from 'class-validator';

export enum PeriodontalMeasurementPointDto {
  MB = 'MB',
  B = 'B',
  DB = 'DB',
  ML = 'ML',
  L = 'L',
  DL = 'DL',
}

const FURCATION_GRADES = ['0', 'I', 'II', 'III'] as const;

/**
 * Field names mirror docs/03-sad/15-module-emr.md Part 3.2D Section 39's
 * literal SaveMeasurementDto ("tooth" renamed toothNumber, numeric, to
 * match the FDI validation already established for Odontogram entries).
 * cal is intentionally absent -- Part 3.2B Section 14: "CAL dihitung
 * otomatis" (auto-computed server-side from pocketDepth + gingivalMargin).
 */
export class SaveMeasurementRequestDto {
  @IsInt() toothNumber!: number;

  @IsEnum(PeriodontalMeasurementPointDto) measurementPoint!: PeriodontalMeasurementPointDto;

  // Part 3.2B Section 21: 0-15mm, max 1 decimal place.
  @IsNumber({ maxDecimalPlaces: 1 }) @Min(0) @Max(15) pocketDepth!: number;

  // Part 3.2B Section 21: can be negative, max +-10mm.
  @IsNumber({ maxDecimalPlaces: 1 }) @Min(-10) @Max(10) gingivalMargin!: number;

  @IsBoolean() bleeding!: boolean;

  @IsOptional() @IsInt() @Min(0) @Max(3) plaqueIndex?: number;

  @IsOptional() @IsInt() @Min(0) @Max(3) mobility?: number;

  @IsOptional() @IsIn(FURCATION_GRADES) furcation?: (typeof FURCATION_GRADES)[number];
}
