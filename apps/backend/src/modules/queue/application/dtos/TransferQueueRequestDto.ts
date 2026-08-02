import { IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

/**
 * docs/03-sad/14-module-queue.md Section 57 TransferQueueRequest.
 * `chairId` is omitted: no Dental Chair master table exists in Phase 1.
 */
export class TransferQueueRequestDto {
  @IsOptional() @IsUUID('4') doctorId?: string;
  @IsString() @MinLength(1) @MaxLength(500) reason!: string;
}
