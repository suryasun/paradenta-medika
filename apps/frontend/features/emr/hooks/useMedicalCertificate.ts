import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { emrService } from "../services/emr.service";
import { IssueMedicalCertificateInput } from "../types/emr.types";

// docs/06-tasks/task-088.md.
export function usePatientMedicalCertificates(patientId: string) {
  return useQuery({
    queryKey: ["emr", "medical-certificates", patientId],
    queryFn: () => emrService.getPatientMedicalCertificates(patientId),
    enabled: Boolean(patientId),
  });
}

export function useIssueMedicalCertificate(visitId: string, patientId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: IssueMedicalCertificateInput) => emrService.issueMedicalCertificate(visitId, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["emr", "medical-certificates", patientId] }),
  });
}
