import { AllergySeverity } from '@prisma/client';
import { IAllergyRepository } from '../../domain/repositories/IAllergyRepository';

export interface DrugAllergyMatch {
  allergyId: string;
  allergen: string;
  severity: AllergySeverity;
  reaction: string | null;
}

/**
 * docs/06-tasks/task-062.md: "Expose a reusable AllergyCheckService that
 * task-065 (Create Prescription) must call before persisting any
 * prescription." This service only answers "does this patient have a
 * recorded Drug allergy matching this medicine name" -- the block-vs-
 * override policy itself is decided by the caller (CreatePrescriptionUseCase
 * hard-blocks on a match, per explicit user sign-off since the SAD leaves
 * it unspecified).
 */
export class AllergyCheckService {
  constructor(private readonly allergyRepository: IAllergyRepository) {}

  async getDrugAllergies(patientId: string): Promise<DrugAllergyMatch[]> {
    const allergies = await this.allergyRepository.findByPatientId(patientId);
    return allergies
      .filter((allergy) => allergy.type === 'DRUG')
      .map((allergy) => ({
        allergyId: allergy.id,
        allergen: allergy.allergen,
        severity: allergy.severity,
        reaction: allergy.reaction,
      }));
  }

  async findMatchingDrugAllergy(patientId: string, medicineName: string): Promise<DrugAllergyMatch | null> {
    const drugAllergies = await this.getDrugAllergies(patientId);
    const normalizedMedicineName = medicineName.trim().toLowerCase();
    return (
      drugAllergies.find((allergy) => {
        const normalizedAllergen = allergy.allergen.trim().toLowerCase();
        return normalizedMedicineName.includes(normalizedAllergen) || normalizedAllergen.includes(normalizedMedicineName);
      }) ?? null
    );
  }
}
