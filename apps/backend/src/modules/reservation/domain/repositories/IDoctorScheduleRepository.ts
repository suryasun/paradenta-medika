import { DoctorSchedule } from '@prisma/client';

export interface IDoctorScheduleRepository {
  findById(id: string): Promise<DoctorSchedule | null>;
  findActiveForDoctorOnDay(doctorId: string, dayOfWeek: number): Promise<DoctorSchedule[]>;
}
