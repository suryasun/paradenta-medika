import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { masterDataTemplateService } from "../services/masterDataTemplate.service";

export function useCreateMasterDataTemplate() {
  const router = useRouter();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { entityType: string; templatePayload: Record<string, unknown>; ownerClinicId: string }) =>
      masterDataTemplateService.create(payload),
    onSuccess: (template) => {
      queryClient.invalidateQueries({ queryKey: ["master-data", "templates", "list"] });
      router.push(`/master-data/templates/${template.id}`);
    },
  });
}

export function useUpdateMasterDataTemplate(templateId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (templatePayload: Record<string, unknown>) => masterDataTemplateService.update(templateId, { templatePayload }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["master-data", "templates", "detail", templateId] }),
  });
}

// Push replaces/creates per branch server-side; a CONFLICT result leaves
// that branch untouched rather than blocking the others (task-222's AC).
export function usePushMasterDataTemplate(templateId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (branchIds: string[]) => masterDataTemplateService.push(templateId, branchIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["master-data", "templates", "detail", templateId] });
      queryClient.invalidateQueries({ queryKey: ["master-data", "templates", "drift", templateId] });
    },
  });
}
