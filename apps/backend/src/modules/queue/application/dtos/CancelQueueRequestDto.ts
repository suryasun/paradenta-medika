import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CancelQueueRequestDto {
  @IsOptional() @IsString() @MaxLength(500) reason?: string;
}
