import { Allergy, AllergySeverity, AllergyType } from '@prisma/client';

export interface CreateAllergyInput {
  patientId: string;
  visitId?: string;
  type: AllergyType;
  allergen: string;
  severity: AllergySeverity;
  reaction?: string;
  notes?: string;
  createdBy: string;
}

export interface IAllergyRepository {
  create(input: CreateAllergyInput): Promise<Allergy>;
  findByPatientId(patientId: string): Promise<Allergy[]>;
}
