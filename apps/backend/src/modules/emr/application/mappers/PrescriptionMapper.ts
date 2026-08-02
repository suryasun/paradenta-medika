import { PrescriptionWithItems } from '../../domain/repositories/IPrescriptionRepository';
import { PrescriptionResponseDto } from '../dtos/PrescriptionResponseDto';

export function toPrescriptionResponseDto(prescription: PrescriptionWithItems): PrescriptionResponseDto {
  return {
    id: prescription.id,
    visitId: prescription.visitId,
    patientId: prescription.patientId,
    doctorId: prescription.doctorId,
    items: prescription.items.map((item) => ({
      id: item.id,
      medicineName: item.medicineName,
      dosage: item.dosage,
      frequency: item.frequency,
      duration: item.duration,
      instruction: item.instruction,
    })),
    createdAt: prescription.createdAt.toISOString(),
    createdBy: prescription.createdBy,
  };
}
