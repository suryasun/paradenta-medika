"use client";

import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { getApiErrorMessage } from "@/lib/api-client";
import { useSaveSoapNote } from "../hooks/useVisitMutations";
import { SoapNote } from "../types/emr.types";

// docs/06-tasks/task-050.md: PUT is a full upsert -- apps/backend's
// SoapNoteRepository.upsert() writes all 4 fields every call (undefined
// becomes null), so this form always submits the complete current state,
// never a partial diff, to avoid silently wiping unrelated fields.
export function SoapNoteSection({ visitId, soapNote, readOnly }: { visitId: string; soapNote: SoapNote | null; readOnly: boolean }) {
  const [subjective, setSubjective] = useState(soapNote?.subjective ?? "");
  const [objective, setObjective] = useState(soapNote?.objective ?? "");
  const [assessment, setAssessment] = useState(soapNote?.assessment ?? "");
  const [plan, setPlan] = useState(soapNote?.plan ?? "");
  const saveSoapNote = useSaveSoapNote(visitId);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    saveSoapNote.mutate({ subjective, objective, assessment, plan });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Textarea id="subjective" label="Subjective" value={subjective} onChange={(e) => setSubjective(e.target.value)} disabled={readOnly} />
      <Textarea id="objective" label="Objective" value={objective} onChange={(e) => setObjective(e.target.value)} disabled={readOnly} />
      <Textarea id="assessment" label="Assessment" value={assessment} onChange={(e) => setAssessment(e.target.value)} disabled={readOnly} />
      <Textarea id="plan" label="Plan" value={plan} onChange={(e) => setPlan(e.target.value)} disabled={readOnly} />
      {saveSoapNote.isError && (
        <p role="alert" className="text-sm text-error">
          {getApiErrorMessage(saveSoapNote.error)}
        </p>
      )}
      {!readOnly && (
        <Button type="submit" isLoading={saveSoapNote.isPending} className="self-start">
          Save SOAP Note
        </Button>
      )}
    </form>
  );
}
