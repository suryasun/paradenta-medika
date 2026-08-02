import { IsBoolean, IsDateString, IsEnum, IsIn, IsOptional, IsString, IsUUID, Matches, MaxLength } from 'class-validator';

export enum FollowUpPriorityDto {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}

const RESERVATION_SOURCES = ['WALK_IN', 'PHONE', 'WHATSAPP', 'WEBSITE', 'MOBILE_APP'] as const;
const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

/**
 * docs/06-tasks/task-090.md: "an 'auto-book reservation' toggle" --
 * doctorId/startTime/reservationType/source are only required when
 * autoSchedule is true (checked in CreateFollowUpUseCase, not here, since
 * class-validator has no built-in conditional-required across sibling
 * fields without the `@ValidateIf` decorator pulling in extra semantics
 * beyond what's already used elsewhere in this codebase).
 */
export class CreateFollowUpRequestDto {
  @IsDateString() followUpDate!: string;
  @IsOptional() @IsString() @MaxLength(2000) note?: string;
  @IsOptional() @IsEnum(FollowUpPriorityDto) priority?: FollowUpPriorityDto;

  @IsOptional() @IsBoolean() autoSchedule?: boolean;
  @IsOptional() @IsUUID('4') doctorId?: string;
  @IsOptional() @Matches(TIME_PATTERN, { message: 'startTime must be in HH:mm format' }) startTime?: string;
  @IsOptional() @IsString() @MaxLength(30) reservationType?: string;
  @IsOptional() @IsIn(RESERVATION_SOURCES) source?: (typeof RESERVATION_SOURCES)[number];
}
