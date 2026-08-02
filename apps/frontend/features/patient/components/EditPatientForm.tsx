"use client";

import { LoadingState } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";
import { getApiErrorMessage } from "@/lib/api-client";
import { usePatient } from "../hooks/usePatient";
import { useUpdatePatient } from "../hooks/usePatientMutations";
import { UpdatePatientInput } from "../types/patient.types";
import { PatientForm } from "./PatientForm";

export function EditPatientForm({ patientId }: { patientId: string }) {
  const { data: patient, isLoading, isError, error, refetch } = usePatient(patientId);
  const updatePatient = useUpdatePatient(patientId);

  if (isLoading) return <LoadingState label="Loading patient..." />;
  if (isError) return <ErrorState message={getApiErrorMessage(error)} onRetry={() => refetch()} />;
  if (!patient) return null;

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold text-foreground">Edit Patient</h1>
      <PatientForm
        mode="edit"
        initialPatient={patient}
        isSubmitting={updatePatient.isPending}
        submitError={updatePatient.isError ? getApiErrorMessage(updatePatient.error) : undefined}
        onSubmit={(payload) => updatePatient.mutate(payload as UpdatePatientInput)}
      />
    </div>
  );
}
