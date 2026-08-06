import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { patientService } from "../services/patient.service";
import { CreatePatientInput, UpdatePatientInput } from "../types/patient.types";

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
