import { useQuery } from "@tanstack/react-query";
import { patientEmergencyContactService } from "../services/patientEmergencyContact.service";

export function usePatientEmergencyContacts(patientId: string) {
  return useQuery({
    queryKey: ["patients", "emergency-contacts", patientId],
    queryFn: () => patientEmergencyContactService.list(patientId),
    enabled: Boolean(patientId),
  });
}
