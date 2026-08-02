import { IsBoolean, IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

/** Mirrors Prisma's ConsentCategory (docs/06-tasks/task-085.md's own literal 3-category list). */
export enum ConsentCategoryDto {
  GENERAL = 'GENERAL',
  CLINICAL = 'CLINICAL',
  SURGICAL = 'SURGICAL',
}

export class CreateConsentTemplateRequestDto {
  @IsEnum(ConsentCategoryDto) category!: ConsentCategoryDto;
  @IsString() @MinLength(1) @MaxLength(200) title!: string;
  @IsString() @MinLength(1) body!: string;
}

export class UpdateConsentTemplateRequestDto {
  @IsOptional() @IsEnum(ConsentCategoryDto) category?: ConsentCategoryDto;
  @IsOptional() @IsString() @MinLength(1) @MaxLength(200) title?: string;
  @IsOptional() @IsString() @MinLength(1) body?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
}
