import { createCrudService } from "../lib/createCrudService";

export interface Clinic {
  id: string;
  clinicCode: string;
  clinicName: string;
  legalName: string;
  taxNumber: string;
  ownerName: string | null;
  phone: string;
  email: string;
  address: string;
  isActive: boolean;
}

// docs/06-tasks/task-021.md
export const clinicService = createCrudService<Clinic>("/clinics");
