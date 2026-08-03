import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { journalService } from "../services/finance.service";
import { JournalLineEntry } from "../types/finance.types";

function invalidate(queryClient: ReturnType<typeof useQueryClient>, id?: string) {
  queryClient.invalidateQueries({ queryKey: ["finance", "journals", "list"] });
  if (id) queryClient.invalidateQueries({ queryKey: ["finance", "journals", "detail", id] });
}

export function useJournals(params?: Record<string, unknown>) {
  return useQuery({ queryKey: ["finance", "journals", "list", params], queryFn: () => journalService.list(params) });
}

export function useJournal(id: string) {
  return useQuery({ queryKey: ["finance", "journals", "detail", id], queryFn: () => journalService.detail(id), enabled: !!id });
}

export function useCreateJournal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { branchId: string; journalDate: string; description: string; lines: JournalLineEntry[] }) => journalService.create(payload),
    onSuccess: () => invalidate(queryClient),
  });
}

export function usePostJournal(id: string) {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: () => journalService.postJournal(id), onSuccess: () => invalidate(queryClient, id) });
}

export function useReverseJournal(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { journalDate: string; reason: string }) => journalService.reverse(id, payload),
    onSuccess: () => invalidate(queryClient, id),
  });
}

export function useVoidJournal(id: string) {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: (reason?: string) => journalService.voidJournal(id, reason), onSuccess: () => invalidate(queryClient, id) });
}
