import { GetDoctorTimeSlotsUseCase } from './GetDoctorTimeSlotsUseCase';

export interface DoctorAvailabilityDto {
  doctorId: string;
  date: string;
  isAvailable: boolean;
  totalSlots: number;
  availableSlots: number;
}

/**
 * docs/03-sad/13-module-reservation.md Section 20.2: GET
 * /api/v1/doctors/{id}/availability -- an aggregate summary over the same
 * slot computation GetDoctorTimeSlotsUseCase performs, so both endpoints
 * stay consistent by construction rather than duplicating the slot logic.
 */
export class GetDoctorAvailabilityUseCase {
  constructor(private readonly getDoctorTimeSlotsUseCase: GetDoctorTimeSlotsUseCase) {}

  async execute(doctorId: string, date: string): Promise<DoctorAvailabilityDto> {
    const slots = await this.getDoctorTimeSlotsUseCase.execute(doctorId, date);
    const availableSlots = slots.filter((slot) => slot.status === 'AVAILABLE').length;

    return {
      doctorId,
      date,
      isAvailable: availableSlots > 0,
      totalSlots: slots.length,
      availableSlots,
    };
  }
}
