import { IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

/** Mirrors Prisma's ReferralTargetType (docs/03-sad/15-module-emr.md Section 26 "Referral"). */
export enum ReferralTargetTypeDto {
  SPECIALIST = 'SPECIALIST',
  HOSPITAL = 'HOSPITAL',
  LABORATORY = 'LABORATORY',
  RADIOLOGY = 'RADIOLOGY',
}

export class CreateReferralRequestDto {
  @IsEnum(ReferralTargetTypeDto) targetType!: ReferralTargetTypeDto;
  @IsString() @MinLength(1) @MaxLength(2000) reason!: string;
  @IsOptional() @IsString() @MaxLength(2000) note?: string;
}
