import { IPatientRepository } from '../../../patient/domain/repositories/IPatientRepository';
import { IDoctorRepository } from '../../../master-data/domain/repositories/IDoctorRepository';
import { PatientNotFoundException } from '../../../patient/domain/exceptions/PatientExceptions';
import { PrescriptionNotFoundException } from '../../domain/exceptions/EmrExceptions';
import { IPrescriptionRepository } from '../../domain/repositories/IPrescriptionRepository';
import { PrescriptionPrintResponseDto } from '../dtos/PrescriptionResponseDto';
import { toPrescriptionResponseDto } from '../mappers/PrescriptionMapper';

/**
 * docs/06-tasks/task-066.md: "a print-ready representation... a minimal,
 * clearly-labeled printable layout should be used rather than inventing an
 * elaborate design." No PDF library is approved, so this returns a
 * structured DTO (all documented fields, plus resolved patient/doctor
 * names) for the frontend to render into a printable view via the
 * browser's own print dialog, rather than generating a PDF server-side.
 */
export class PrintPrescriptionUseCase {
  constructor(
    private readonly prescriptionRepository: IPrescriptionRepository,
    private readonly patientRepository: IPatientRepository,
    private readonly doctorRepository: IDoctorRepository,
  ) {}

  async execute(prescriptionId: string): Promise<PrescriptionPrintResponseDto> {
    const prescription = await this.prescriptionRepository.findById(prescriptionId);
    if (!prescription) {
      throw new PrescriptionNotFoundException();
    }

    const patient = await this.patientRepository.findById(prescription.patientId);
    if (!patient) {
      throw new PatientNotFoundException();
    }
    const doctor = await this.doctorRepository.findById(prescription.doctorId);

    return {
      ...toPrescriptionResponseDto(prescription),
      patientName: patient.patientName,
      doctorName: doctor?.fullName ?? 'Unknown Doctor',
    };
  }
}
