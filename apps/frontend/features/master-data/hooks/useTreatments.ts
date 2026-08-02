import { useQuery } from "@tanstack/react-query";
import { treatmentService } from "../services/treatment.service";

export function useTreatments(search?: string) {
  return useQuery({
    queryKey: ["treatments", "list", search ?? ""],
    queryFn: () => treatmentService.list({ search }),
  });
}
