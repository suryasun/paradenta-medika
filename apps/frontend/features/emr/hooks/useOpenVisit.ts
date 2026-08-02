import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { emrService } from "../services/emr.service";

export function useOpenVisit() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (queueId: string) => emrService.openVisit(queueId),
    onSuccess: (visit) => {
      queryClient.invalidateQueries({ queryKey: ["queues"] });
      router.push(`/emr/visits/${visit.id}`);
    },
  });
}
