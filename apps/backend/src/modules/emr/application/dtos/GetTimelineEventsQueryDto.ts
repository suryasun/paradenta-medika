import { IsEnum, IsOptional } from 'class-validator';

export enum TimelineEventTypeDto {
  VISIT = 'VISIT',
  SOAP = 'SOAP',
  DIAGNOSIS = 'DIAGNOSIS',
  TREATMENT = 'TREATMENT',
  PRESCRIPTION = 'PRESCRIPTION',
  ODONTOGRAM = 'ODONTOGRAM',
  ATTACHMENT = 'ATTACHMENT',
  CONSENT = 'CONSENT',
  REFERRAL = 'REFERRAL',
  FOLLOW_UP = 'FOLLOW_UP',
}

export class GetTimelineEventsQueryDto {
  @IsOptional() @IsEnum(TimelineEventTypeDto) eventType?: TimelineEventTypeDto;
}
