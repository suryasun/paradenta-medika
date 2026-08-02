"use client";

import { useMedicalHistory, useAllergies } from "../hooks/usePatientClinicalData";
import { formatEnumLabel } from "../utils/formatEnumLabel";
import { cn } from "@/utils/cn";

// docs/06-tasks/task-061.md: "Surfaces as a Clinical Alert whenever any
// subsequent Visit is opened for the patient."
// docs/06-tasks/task-062.md: "Allergy muncul sebagai alert ketika Visit
// dibuka" -- persistent, Severe allergies especially prominent.
export function ClinicalAlertBanner({ patientId }: { patientId: string }) {
  const { data: history } = useMedicalHistory(patientId);
  const { data: allergies } = useAllergies(patientId);

  const activeHistory = history ?? [];
  const allAllergies = allergies ?? [];
  const hasSevereAllergy = allAllergies.some((a) => a.severity === "SEVERE");

  if (activeHistory.length === 0 && allAllergies.length === 0) {
    return null;
  }

  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col gap-2 rounded-lg border p-4 text-sm",
        hasSevereAllergy ? "border-error bg-error-bg text-error" : "border-warning bg-warning-bg text-warning",
      )}
    >
      <p className="font-semibold">Clinical Alert</p>
      {allAllergies.length > 0 && (
        <div className="flex flex-col gap-1">
          <p className="font-medium">Allergies</p>
          <ul className="flex flex-wrap gap-x-4 gap-y-1">
            {allAllergies.map((allergy) => (
              <li key={allergy.id}>
                {formatEnumLabel(allergy.type)}: {allergy.allergen} ({allergy.severity})
              </li>
            ))}
          </ul>
        </div>
      )}
      {activeHistory.length > 0 && (
        <div className="flex flex-col gap-1">
          <p className="font-medium">Medical History</p>
          <ul className="flex flex-wrap gap-x-4 gap-y-1">
            {activeHistory.map((entry) => (
              <li key={entry.id}>{formatEnumLabel(entry.category)}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
