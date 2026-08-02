import { useQuery } from "@tanstack/react-query";
import { emrService } from "../services/emr.service";

export function useVisit(id: string) {
  return useQuery({
    queryKey: ["emr", "visit", id],
    queryFn: () => emrService.detail(id),
    enabled: Boolean(id),
  });
}
