"use client";

import { getApiErrorMessage } from "@/lib/api-client";
import { useCreatePatient } from "../hooks/usePatientMutations";
import { CreatePatientInput } from "../types/patient.types";
import { PatientForm } from "./PatientForm";

export function RegisterPatientForm() {
  const createPatient = useCreatePatient();

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold text-foreground">Register Patient</h1>
      <PatientForm
        mode="create"
        isSubmitting={createPatient.isPending}
        submitError={createPatient.isError ? getApiErrorMessage(createPatient.error) : undefined}
        onSubmit={(payload) => createPatient.mutate(payload as CreatePatientInput)}
      />
    </div>
  );
}
