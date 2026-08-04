import { useQuery } from "@tanstack/react-query";
import { reportCatalogService } from "../services/reports.service";

export function useReportCatalog() {
  return useQuery({ queryKey: ["reports", "catalog"], queryFn: () => reportCatalogService.list() });
}
