import { DoctorSchedule } from '@prisma/client';
import { prisma } from '../../../../shared/infrastructure/prisma';
import { IDoctorScheduleRepository } from '../../domain/repositories/IDoctorScheduleRepository';

export class DoctorScheduleRepository implements IDoctorScheduleRepository {
  async findById(id: string): Promise<DoctorSchedule | null> {
    return prisma.doctorSchedule.findFirst({ where: { id, deletedAt: null } });
  }

  async findActiveForDoctorOnDay(doctorId: string, dayOfWeek: number): Promise<DoctorSchedule[]> {
    return prisma.doctorSchedule.findMany({
      where: { doctorId, dayOfWeek, isActive: true, deletedAt: null },
    });
  }
}
