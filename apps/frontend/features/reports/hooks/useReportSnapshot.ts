import { useQuery } from "@tanstack/react-query";
import { reportSnapshotService } from "../services/reports.service";

export function useReportSnapshot(snapshotId: string | null) {
  return useQuery({
    queryKey: ["reports", "snapshots", snapshotId],
    queryFn: () => reportSnapshotService.get(snapshotId as string),
    enabled: !!snapshotId,
  });
}
