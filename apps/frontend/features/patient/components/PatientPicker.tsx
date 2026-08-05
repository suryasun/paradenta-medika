"use client";

import { useState } from "react";
import { Input } from "@/components/ui/Input";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { usePatients } from "../hooks/usePatients";
import { Patient } from "../types/patient.types";
import { QuickAddPatientModal } from "./QuickAddPatientModal";

// Reusable typeahead: Reservation (task-002/031) needs to select an
// existing patient by name/MRN/phone; no dedicated "patient picker" spec
// exists anywhere in docs/02-design, so this reuses the same search
// semantics as PatientListView's search box.
//
// `allowQuickAdd` (task-289, Epic PE6) surfaces a "Quick Add Patient"
// affordance in the no-results state. Opt-in and off by default so it
// stays confined to the Reservation booking screen, per that task's own
// Acceptance Criteria ("not exposed as a general-purpose alternate
// registration endpoint elsewhere in the product") -- AddToQueueModal's
// existing PatientPicker usage is unaffected.
export function PatientPicker({
  selectedPatient,
  onSelect,
  allowQuickAdd = false,
}: {
  selectedPatient: Patient | null;
  onSelect: (patient: Patient) => void;
  allowQuickAdd?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const debouncedQuery = useDebouncedValue(query);
  const { data, isFetching } = usePatients({ search: debouncedQuery || undefined, limit: 8, status: "ACTIVE" });
  const showResults = query.trim().length > 0 && !selectedPatient;

  if (selectedPatient) {
    return (
      <div className="flex items-center justify-between rounded-md border border-border bg-white px-3 py-2 text-sm">
        <span>
          {selectedPatient.fullName} <span className="text-muted">({selectedPatient.medicalRecordNumber})</span>
        </span>
        <button type="button" className="text-xs font-medium text-primary hover:underline" onClick={() => onSelect(null as never)}>
          Change
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <Input
        id="patientSearch"
        label="Patient"
        placeholder="Search by name, MRN, or phone..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {showResults && (
        <div className="absolute z-10 mt-1 w-full rounded-md border border-border bg-white shadow-md">
          {isFetching && <div className="px-3 py-2 text-sm text-muted">Searching...</div>}
          {!isFetching && data?.items.length === 0 && (
            <div className="flex flex-col gap-2 px-3 py-2 text-sm text-muted">
              <span>No patients found.</span>
              {allowQuickAdd && (
                <button
                  type="button"
                  className="self-start text-xs font-medium text-primary hover:underline"
                  onClick={() => setShowQuickAdd(true)}
                >
                  Quick Add Patient
                </button>
              )}
            </div>
          )}
          {!isFetching &&
            data?.items.map((patient) => (
              <button
                key={patient.id}
                type="button"
                className="block w-full px-3 py-2 text-left text-sm hover:bg-slate-50"
                onClick={() => {
                  onSelect(patient);
                  setQuery("");
                }}
              >
                {patient.fullName} <span className="text-muted">({patient.medicalRecordNumber})</span>
              </button>
            ))}
        </div>
      )}

      {showQuickAdd && (
        <QuickAddPatientModal
          onClose={() => setShowQuickAdd(false)}
          onCreated={(patient) => {
            setShowQuickAdd(false);
            setQuery("");
            onSelect(patient);
          }}
        />
      )}
    </div>
  );
}
