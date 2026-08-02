import { useQuery } from "@tanstack/react-query";
import { consentTemplateService } from "../services/consentTemplate.service";

export function useConsentTemplates() {
  return useQuery({
    queryKey: ["master-data", "consent-templates", "list"],
    queryFn: () => consentTemplateService.list(),
  });
}
