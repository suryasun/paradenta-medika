export interface PrescriptionItemResponseDto {
  id: string;
  medicineName: string;
  dosage: string;
  frequency: string;
  duration: string;
  instruction: string | null;
}

export interface PrescriptionResponseDto {
  id: string;
  visitId: string;
  patientId: string;
  doctorId: string;
  items: PrescriptionItemResponseDto[];
  createdAt: string;
  createdBy: string | null;
}

export interface PrescriptionPrintResponseDto extends PrescriptionResponseDto {
  patientName: string;
  doctorName: string;
}
