/**
 * docs/03-sad/13-module-reservation.md Section 16.3 Slot Status /
 * Section 16.4 Slot Calculation.
 */
export interface TimeSlotDto {
  time: string;
  capacity: number;
  reserved: number;
  available: number;
  status: 'AVAILABLE' | 'FULL';
}
