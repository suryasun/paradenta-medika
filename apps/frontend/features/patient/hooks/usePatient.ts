import { useQuery } from "@tanstack/react-query";
import { patientService } from "../services/patient.service";

export function usePatient(id: string) {
  return useQuery({
    queryKey: ["patients", "detail", id],
    queryFn: () => patientService.detail(id),
    enabled: Boolean(id),
  });
}
