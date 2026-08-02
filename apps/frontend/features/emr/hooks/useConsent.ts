import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { emrService } from "../services/emr.service";
import { CreateConsentInput, SignConsentInput } from "../types/emr.types";

// docs/06-tasks/task-086.md/task-087.md.
export function usePatientConsents(patientId: string) {
  return useQuery({
    queryKey: ["emr", "consents", patientId],
    queryFn: () => emrService.getPatientConsents(patientId),
    enabled: Boolean(patientId),
  });
}

export function useCreateConsent(patientId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateConsentInput) => emrService.createConsent(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["emr", "consents", patientId] }),
  });
}

export function useSignConsent(patientId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ consentId, payload }: { consentId: string; payload: SignConsentInput }) => emrService.signConsent(consentId, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["emr", "consents", patientId] }),
  });
}
