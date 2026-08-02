"use client";

import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/Table";
import { getApiErrorMessage } from "@/lib/api-client";
import { useRecordVitalSign } from "../hooks/useVisitMutations";
import { RecordVitalSignInput, VitalSign } from "../types/emr.types";

function toNumber(value: string): number | undefined {
  return value === "" ? undefined : Number(value);
}

export function VitalSignSection({ visitId, vitalSigns, readOnly }: { visitId: string; vitalSigns: VitalSign[]; readOnly: boolean }) {
  const [form, setForm] = useState({ bloodPressure: "", heartRate: "", respiratoryRate: "", temperature: "", weight: "", height: "", oxygenSaturation: "" });
  const recordVitalSign = useRecordVitalSign(visitId);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const payload: RecordVitalSignInput = {
      bloodPressure: form.bloodPressure || undefined,
      heartRate: toNumber(form.heartRate),
      respiratoryRate: toNumber(form.respiratoryRate),
      temperature: toNumber(form.temperature),
      weight: toNumber(form.weight),
      height: toNumber(form.height),
      oxygenSaturation: toNumber(form.oxygenSaturation),
    };
    recordVitalSign.mutate(payload, {
      onSuccess: () => setForm({ bloodPressure: "", heartRate: "", respiratoryRate: "", temperature: "", weight: "", height: "", oxygenSaturation: "" }),
    });
  }

  return (
    <div className="flex flex-col gap-4">
      {vitalSigns.length === 0 ? (
        <EmptyState title="No vital signs recorded yet" />
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Recorded At</TableHeaderCell>
              <TableHeaderCell>BP</TableHeaderCell>
              <TableHeaderCell>HR</TableHeaderCell>
              <TableHeaderCell>RR</TableHeaderCell>
              <TableHeaderCell>Temp</TableHeaderCell>
              <TableHeaderCell>Weight</TableHeaderCell>
              <TableHeaderCell>Height</TableHeaderCell>
              <TableHeaderCell>SpO2</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {vitalSigns.map((vs) => (
              <TableRow key={vs.id}>
                <TableCell>{new Date(vs.recordedAt).toLocaleString()}</TableCell>
                <TableCell>{vs.bloodPressure ?? "-"}</TableCell>
                <TableCell>{vs.heartRate ?? "-"}</TableCell>
                <TableCell>{vs.respiratoryRate ?? "-"}</TableCell>
                <TableCell>{vs.temperature ?? "-"}</TableCell>
                <TableCell>{vs.weight ?? "-"}</TableCell>
                <TableCell>{vs.height ?? "-"}</TableCell>
                <TableCell>{vs.oxygenSaturation ?? "-"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {!readOnly && (
        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-3 rounded-lg border border-border p-4 sm:grid-cols-4">
          <Input id="bloodPressure" label="Blood Pressure" placeholder="120/80" value={form.bloodPressure} onChange={(e) => setForm((f) => ({ ...f, bloodPressure: e.target.value }))} />
          <Input id="heartRate" label="Heart Rate" type="number" value={form.heartRate} onChange={(e) => setForm((f) => ({ ...f, heartRate: e.target.value }))} />
          <Input id="respiratoryRate" label="Respiratory Rate" type="number" value={form.respiratoryRate} onChange={(e) => setForm((f) => ({ ...f, respiratoryRate: e.target.value }))} />
          <Input id="temperature" label="Temperature" type="number" step="0.1" value={form.temperature} onChange={(e) => setForm((f) => ({ ...f, temperature: e.target.value }))} />
          <Input id="weight" label="Weight (kg)" type="number" step="0.1" value={form.weight} onChange={(e) => setForm((f) => ({ ...f, weight: e.target.value }))} />
          <Input id="height" label="Height (cm)" type="number" step="0.1" value={form.height} onChange={(e) => setForm((f) => ({ ...f, height: e.target.value }))} />
          <Input id="oxygenSaturation" label="SpO2 (%)" type="number" value={form.oxygenSaturation} onChange={(e) => setForm((f) => ({ ...f, oxygenSaturation: e.target.value }))} />
          <div className="col-span-full flex flex-col gap-2">
            {recordVitalSign.isError && (
              <p role="alert" className="text-sm text-error">
                {getApiErrorMessage(recordVitalSign.error)}
              </p>
            )}
            <Button type="submit" isLoading={recordVitalSign.isPending} className="self-start">
              Record Vital Sign
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
