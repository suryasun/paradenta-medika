import { createCrudService } from "../lib/createCrudService";

export interface Branch {
  id: string;
  clinicId: string;
  branchCode: string;
  branchName: string;
  phone: string;
  email: string;
  address: string;
  timezone: string;
  isActive: boolean;
}

// docs/06-tasks/task-022.md
export const branchService = createCrudService<Branch>("/branches");
