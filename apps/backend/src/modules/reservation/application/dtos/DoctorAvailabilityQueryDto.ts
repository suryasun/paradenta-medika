import { IsDateString } from 'class-validator';

export class DoctorAvailabilityQueryDto {
  @IsDateString() date!: string;
}
