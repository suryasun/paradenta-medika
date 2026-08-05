import { useQuery } from "@tanstack/react-query";
import { patientAddressService } from "../services/patientAddress.service";

export function usePatientAddresses(patientId: string) {
  return useQuery({
    queryKey: ["patients", "addresses", patientId],
    queryFn: () => patientAddressService.list(patientId),
    enabled: Boolean(patientId),
  });
}
