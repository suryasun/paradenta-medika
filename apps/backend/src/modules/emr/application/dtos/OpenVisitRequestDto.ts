import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class OpenVisitRequestDto {
  @IsUUID('4') queueId!: string;
  @IsOptional() @IsString() @MaxLength(1000) chiefComplaint?: string;
}
