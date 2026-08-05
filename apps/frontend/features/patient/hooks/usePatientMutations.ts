import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { patientService } from "../services/patient.service";
import { CreatePatientInput, QuickAddPatientInput, UpdatePatientInput } from "../types/patient.types";

export function useCreatePatient() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreatePatientInput) => patientService.create(payload),
    onSuccess: (patient) => {
      queryClient.invalidateQueries({ queryKey: ["patients", "list"] });
      router.push(`/patients/${patient.id}`);
    },
  });
}

// task-289 (Epic PE6, Patient Module Enhancement addendum): deliberately
// does not redirect to the Patient detail page like useCreatePatient --
// callers (the Reservation booking screen) select the resulting patient
// and continue their own flow instead.
export function useQuickAddPatient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: QuickAddPatientInput) => patientService.quickAdd(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patients", "list"] });
    },
  });
}

export function useUpdatePatient(id: string) {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdatePatientInput) => patientService.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patients", "list"] });
      queryClient.invalidateQueries({ queryKey: ["patients", "detail", id] });
      router.push(`/patients/${id}`);
    },
  });
}

export function useArchivePatient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => patientService.archive(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ["patients", "list"] });
      queryClient.invalidateQueries({ queryKey: ["patients", "detail", id] });
    },
  });
}

export function useRestorePatient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => patientService.restore(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ["patients", "list"] });
      queryClient.invalidateQueries({ queryKey: ["patients", "detail", id] });
    },
  });
}
