import { useMutation } from "@tanstack/react-query";
import { onDemandReportService } from "../services/reports.service";

export function useOnDemandReport<T>() {
  return useMutation({
    mutationFn: ({ reportCode, params }: { reportCode: string; params?: Record<string, unknown> }) =>
      onDemandReportService.get<T>(reportCode, params),
  });
}
