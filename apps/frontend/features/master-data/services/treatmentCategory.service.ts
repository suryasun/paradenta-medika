import { createCrudService } from "../lib/createCrudService";

export interface TreatmentCategory {
  id: string;
  categoryCode: string;
  categoryName: string;
  isActive: boolean;
}

// docs/06-tasks/task-024.md
export const treatmentCategoryService = createCrudService<TreatmentCategory>("/treatment-categories");
