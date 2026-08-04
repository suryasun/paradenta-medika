import { useMutation } from "@tanstack/react-query";
import { reportExportService } from "../services/reports.service";

export function useDownloadExport() {
  return useMutation({
    mutationFn: async (artifactId: string) => {
      const { blob, filename } = await reportExportService.download(artifactId);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    },
  });
}
