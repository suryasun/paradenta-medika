import { useQuery } from "@tanstack/react-query";
import { toothConditionService } from "../services/toothCondition.service";

export function useToothConditions() {
  return useQuery({
    queryKey: ["master-data", "tooth-conditions", "list"],
    queryFn: () => toothConditionService.list(),
  });
}
