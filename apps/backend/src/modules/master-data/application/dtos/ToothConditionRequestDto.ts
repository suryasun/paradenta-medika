import { IsBoolean, IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

/** Mirrors Prisma's ToothConditionCategory (docs/03-sad/15-module-emr.md Part 3.1C Section 21.2). */
export enum ToothConditionCategoryDto {
  HEALTHY = 'HEALTHY',
  DISEASE = 'DISEASE',
  RESTORATION = 'RESTORATION',
  PROSTHODONTIC = 'PROSTHODONTIC',
  ENDODONTIC = 'ENDODONTIC',
  SURGICAL = 'SURGICAL',
  ORTHODONTIC = 'ORTHODONTIC',
  IMPLANTOLOGY = 'IMPLANTOLOGY',
}

export class CreateToothConditionRequestDto {
  @IsString() @MinLength(2) @MaxLength(30) conditionCode!: string;
  @IsString() @MinLength(2) @MaxLength(100) conditionName!: string;
  @IsEnum(ToothConditionCategoryDto) category!: ToothConditionCategoryDto;
  @IsOptional() @IsString() @MaxLength(20) colorCode?: string;
}

export class UpdateToothConditionRequestDto {
  @IsOptional() @IsString() @MinLength(2) @MaxLength(100) conditionName?: string;
  @IsOptional() @IsEnum(ToothConditionCategoryDto) category?: ToothConditionCategoryDto;
  @IsOptional() @IsString() @MaxLength(20) colorCode?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
}
