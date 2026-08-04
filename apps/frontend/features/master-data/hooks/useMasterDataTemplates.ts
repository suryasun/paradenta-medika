import { useQuery } from "@tanstack/react-query";
import { masterDataTemplateService } from "../services/masterDataTemplate.service";

export function useMasterDataTemplates() {
  return useQuery({
    queryKey: ["master-data", "templates", "list"],
    queryFn: () => masterDataTemplateService.list(),
  });
}

export function useMasterDataTemplate(templateId: string) {
  return useQuery({
    queryKey: ["master-data", "templates", "detail", templateId],
    queryFn: () => masterDataTemplateService.get(templateId),
    enabled: Boolean(templateId),
  });
}

export function useTemplateDrift(templateId: string) {
  return useQuery({
    queryKey: ["master-data", "templates", "drift", templateId],
    queryFn: () => masterDataTemplateService.getDrift(templateId),
    enabled: Boolean(templateId),
  });
}
