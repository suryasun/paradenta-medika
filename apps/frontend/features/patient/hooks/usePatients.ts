import { useQuery } from "@tanstack/react-query";
import { patientService } from "../services/patient.service";
import { ListPatientsParams } from "../types/patient.types";

export function usePatients(params: ListPatientsParams) {
  return useQuery({
    queryKey: ["patients", "list", params],
    queryFn: () => patientService.list(params),
    placeholderData: (previous) => previous,
  });
}
