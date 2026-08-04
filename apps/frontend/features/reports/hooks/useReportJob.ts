import { useMutation, useQuery } from "@tanstack/react-query";
import { reportJobService } from "../services/reports.service";
import { ReportJobFilters } from "../types/reports.types";

export function useCreateReportJob() {
  return useMutation({
    mutationFn: ({ reportCode, payload }: { reportCode: string; payload: { filters?: ReportJobFilters; format?: "csv" | "json"; timezone?: string } }) =>
      reportJobService.create(reportCode, payload),
  });
}

export function useReportJob(jobId: string | null) {
  return useQuery({ queryKey: ["reports", "jobs", jobId], queryFn: () => reportJobService.detail(jobId as string), enabled: !!jobId });
}

export function useCancelReportJob() {
  return useMutation({ mutationFn: (jobId: string) => reportJobService.cancel(jobId) });
}
