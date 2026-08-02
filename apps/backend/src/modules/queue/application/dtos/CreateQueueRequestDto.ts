import { IsBoolean, IsOptional, IsUUID } from 'class-validator';

/**
 * Field names per docs/03-sad/14-module-queue.md Section 57
 * CreateQueueRequest (`clinicId` omitted -- no Poli/department master
 * table exists in Phase 1, see schema.prisma's Queue model note).
 * `isEmergency` is an addition to select QueueType.EMERGENCY (Section 20
 * Priority Order includes Emergency, but the documented DTO has no field
 * for it); queueType otherwise derives from whether reservationId is set.
 */
export class CreateQueueRequestDto {
  @IsUUID('4') patientId!: string;
  @IsUUID('4') doctorId!: string;
  @IsOptional() @IsUUID('4') reservationId?: string;
  @IsOptional() @IsBoolean() isEmergency?: boolean;
}
