"use client";

import { FormEvent, useState } from "react";
import { Lock, Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingState } from "@/components/ui/LoadingState";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/Table";
import { PermissionGuard } from "@/components/guards/PermissionGuard";
import { getApiErrorMessage } from "@/lib/api-client";
import {
  useAddPeriodontalMeasurement,
  useCreatePeriodontalAssessment,
  useDeletePeriodontalMeasurement,
  useLockPeriodontalAssessment,
  usePeriodontalAssessment,
  useUpdatePeriodontalMeasurement,
} from "../hooks/usePeriodontalAssessment";
import {
  FDI_TOOTH_NUMBERS,
  FURCATION_APPLICABLE_TEETH,
  FURCATION_GRADES,
  PERIODONTAL_MEASUREMENT_POINTS,
  PeriodontalMeasurement,
  PeriodontalMeasurementPoint,
  SaveMeasurementInput,
} from "../types/emr.types";

const STATUS_TONE = {
  DRAFT: "neutral",
  IN_PROGRESS: "info",
  COMPLETED: "info",
  REVIEWED: "warning",
  LOCKED: "success",
  ARCHIVED: "neutral",
} as const;

const emptyForm = {
  toothNumber: FDI_TOOTH_NUMBERS[0],
  measurementPoint: "MB" as PeriodontalMeasurementPoint,
  pocketDepth: "",
  gingivalMargin: "",
  bleeding: false,
  plaqueIndex: "",
  mobility: "",
  furcation: "",
};

// docs/06-tasks/task-071.md..task-077.md: no "get assessment by visit"
// endpoint exists in this epic's literal API surface (only "by
// assessmentId" and "history by patient, given an assessmentId"), so the
// active assessmentId for this Visit is tracked in local component state
// once Created -- it does not survive a page refresh mid-visit. Flagged as
// a known gap rather than inventing an undocumented endpoint.
export function PeriodontalAssessmentSection({
  visitId,
  patientId,
  doctorId,
  readOnly,
}: {
  visitId: string;
  patientId: string;
  doctorId: string;
  readOnly: boolean;
}) {
  const [assessmentId, setAssessmentId] = useState<string | null>(null);
  const createAssessment = useCreatePeriodontalAssessment();

  if (assessmentId === null) {
    const startAction = !readOnly ? (
      <PermissionGuard permission="emr.periodontal.create">
        <Button
          isLoading={createAssessment.isPending}
          onClick={() =>
            createAssessment.mutate(
              { visitId, patientId, doctorId },
              { onSuccess: (assessment) => setAssessmentId(assessment.id) },
            )
          }
        >
          Start Periodontal Assessment
        </Button>
      </PermissionGuard>
    ) : undefined;

    return (
      <div className="flex flex-col gap-3">
        <EmptyState title="No periodontal assessment started for this visit yet" action={startAction} />
        {createAssessment.isError && (
          <p role="alert" className="text-sm text-error">
            {getApiErrorMessage(createAssessment.error)}
          </p>
        )}
      </div>
    );
  }

  return <PeriodontalChart assessmentId={assessmentId} readOnly={readOnly} />;
}

function PeriodontalChart({ assessmentId, readOnly }: { assessmentId: string; readOnly: boolean }) {
  const { data: assessment, isLoading, isError, error, refetch } = usePeriodontalAssessment(assessmentId);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const addMeasurement = useAddPeriodontalMeasurement(assessmentId);
  const updateMeasurement = useUpdatePeriodontalMeasurement(assessmentId);
  const deleteMeasurement = useDeletePeriodontalMeasurement(assessmentId);
  const lockAssessment = useLockPeriodontalAssessment(assessmentId);

  if (isLoading) return <LoadingState label="Loading periodontal assessment..." rows={4} columns={9} />;
  if (isError) return <ErrorState message={getApiErrorMessage(error)} onRetry={() => refetch()} />;
  if (!assessment) return null;

  const locked = assessment.status === "LOCKED";
  const furcationApplicable = FURCATION_APPLICABLE_TEETH.includes(form.toothNumber);

  function startEdit(measurement: PeriodontalMeasurement) {
    setEditingId(measurement.id);
    setForm({
      toothNumber: measurement.toothNumber,
      measurementPoint: measurement.measurementPoint,
      pocketDepth: String(measurement.pocketDepth),
      gingivalMargin: String(measurement.gingivalMargin),
      bleeding: measurement.bleeding,
      plaqueIndex: measurement.plaqueIndex !== null ? String(measurement.plaqueIndex) : "",
      mobility: measurement.mobility !== null ? String(measurement.mobility) : "",
      furcation: measurement.furcation ?? "",
    });
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.pocketDepth || !form.gingivalMargin) return;
    const payload: SaveMeasurementInput = {
      toothNumber: form.toothNumber,
      measurementPoint: form.measurementPoint,
      pocketDepth: Number(form.pocketDepth),
      gingivalMargin: Number(form.gingivalMargin),
      bleeding: form.bleeding,
      plaqueIndex: form.plaqueIndex ? Number(form.plaqueIndex) : undefined,
      mobility: form.mobility ? Number(form.mobility) : undefined,
      furcation: furcationApplicable && form.furcation ? form.furcation : undefined,
    };
    if (editingId) {
      updateMeasurement.mutate({ id: editingId, payload }, { onSuccess: resetForm });
    } else {
      addMeasurement.mutate(payload, { onSuccess: resetForm });
    }
  }

  const mutationError = editingId ? updateMeasurement.error : addMeasurement.error;
  const mutationIsError = editingId ? updateMeasurement.isError : addMeasurement.isError;
  const mutationIsPending = editingId ? updateMeasurement.isPending : addMeasurement.isPending;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <Badge tone={STATUS_TONE[assessment.status]}>{assessment.status}</Badge>
        {!readOnly && !locked && (
          <PermissionGuard permission="emr.periodontal.lock">
            <Button variant="secondary" isLoading={lockAssessment.isPending} onClick={() => lockAssessment.mutate()}>
              <Lock size={14} strokeWidth={1.75} aria-hidden="true" />
              Lock Assessment
            </Button>
          </PermissionGuard>
        )}
      </div>

      {assessment.measurements.length === 0 ? (
        <EmptyState title="No measurements recorded yet" description={!readOnly && !locked ? "Use the form below to record the first measurement." : undefined} />
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Tooth</TableHeaderCell>
              <TableHeaderCell>Point</TableHeaderCell>
              <TableHeaderCell>Pocket Depth</TableHeaderCell>
              <TableHeaderCell>Gingival Margin</TableHeaderCell>
              <TableHeaderCell>CAL</TableHeaderCell>
              <TableHeaderCell>Bleeding</TableHeaderCell>
              <TableHeaderCell>Plaque</TableHeaderCell>
              <TableHeaderCell>Mobility</TableHeaderCell>
              <TableHeaderCell>Furcation</TableHeaderCell>
              {!readOnly && !locked && <TableHeaderCell>Actions</TableHeaderCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {assessment.measurements.map((measurement) => (
              <TableRow key={measurement.id}>
                <TableCell>{measurement.toothNumber}</TableCell>
                <TableCell>{measurement.measurementPoint}</TableCell>
                <TableCell>{measurement.pocketDepth} mm</TableCell>
                <TableCell>{measurement.gingivalMargin} mm</TableCell>
                <TableCell>{measurement.cal} mm</TableCell>
                <TableCell>
                  <Badge tone={measurement.bleeding ? "error" : "neutral"}>{measurement.bleeding ? "Yes" : "No"}</Badge>
                </TableCell>
                <TableCell>{measurement.plaqueIndex ?? "-"}</TableCell>
                <TableCell>{measurement.mobility ?? "-"}</TableCell>
                <TableCell>{measurement.furcation ?? "-"}</TableCell>
                {!readOnly && !locked && (
                  <TableCell>
                    <div className="flex gap-3">
                      <PermissionGuard permission="emr.periodontal.measurement.update">
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                          onClick={() => startEdit(measurement)}
                        >
                          <Pencil size={13} strokeWidth={1.75} aria-hidden="true" />
                          Edit
                        </button>
                      </PermissionGuard>
                      <PermissionGuard permission="emr.periodontal.measurement.delete">
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 text-sm font-medium text-error hover:underline"
                          onClick={() => deleteMeasurement.mutate(measurement.id)}
                        >
                          <Trash2 size={13} strokeWidth={1.75} aria-hidden="true" />
                          Delete
                        </button>
                      </PermissionGuard>
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {!readOnly && !locked && (
        <PermissionGuard permission={editingId ? "emr.periodontal.measurement.update" : "emr.periodontal.measurement.record"}>
          <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3 rounded-lg border border-border p-4">
            <Select
              id="measurementToothNumber"
              label="Tooth (FDI)"
              value={form.toothNumber}
              onChange={(e) => setForm((f) => ({ ...f, toothNumber: Number(e.target.value) }))}
            >
              {FDI_TOOTH_NUMBERS.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </Select>
            <Select
              id="measurementPoint"
              label="Point"
              value={form.measurementPoint}
              onChange={(e) => setForm((f) => ({ ...f, measurementPoint: e.target.value as PeriodontalMeasurementPoint }))}
            >
              {PERIODONTAL_MEASUREMENT_POINTS.map((point) => (
                <option key={point} value={point}>
                  {point}
                </option>
              ))}
            </Select>
            <Input
              id="pocketDepth"
              label="Pocket Depth (mm)"
              type="number"
              min={0}
              max={15}
              step="0.1"
              value={form.pocketDepth}
              onChange={(e) => setForm((f) => ({ ...f, pocketDepth: e.target.value }))}
              className="min-w-28"
            />
            <Input
              id="gingivalMargin"
              label="Gingival Margin (mm)"
              type="number"
              min={-10}
              max={10}
              step="0.1"
              value={form.gingivalMargin}
              onChange={(e) => setForm((f) => ({ ...f, gingivalMargin: e.target.value }))}
              className="min-w-28"
            />
            <label className="flex items-center gap-2 pb-2 text-sm font-medium text-foreground">
              <input type="checkbox" checked={form.bleeding} onChange={(e) => setForm((f) => ({ ...f, bleeding: e.target.checked }))} />
              Bleeding
            </label>
            <Select
              id="plaqueIndex"
              label="Plaque Index"
              value={form.plaqueIndex}
              onChange={(e) => setForm((f) => ({ ...f, plaqueIndex: e.target.value }))}
            >
              <option value="">-</option>
              {[0, 1, 2, 3].map((score) => (
                <option key={score} value={score}>
                  {score}
                </option>
              ))}
            </Select>
            <Select id="mobility" label="Mobility Grade" value={form.mobility} onChange={(e) => setForm((f) => ({ ...f, mobility: e.target.value }))}>
              <option value="">-</option>
              {[0, 1, 2, 3].map((grade) => (
                <option key={grade} value={grade}>
                  {grade}
                </option>
              ))}
            </Select>
            {furcationApplicable && (
              <Select id="furcation" label="Furcation" value={form.furcation} onChange={(e) => setForm((f) => ({ ...f, furcation: e.target.value }))}>
                <option value="">-</option>
                {FURCATION_GRADES.map((grade) => (
                  <option key={grade} value={grade}>
                    {grade}
                  </option>
                ))}
              </Select>
            )}
            <Button type="submit" isLoading={mutationIsPending} disabled={!form.pocketDepth || !form.gingivalMargin}>
              {editingId ? "Update Measurement" : "Add Measurement"}
            </Button>
            {editingId && (
              <Button type="button" variant="secondary" onClick={resetForm}>
                Cancel
              </Button>
            )}
            {mutationIsError && (
              <p role="alert" className="w-full text-sm text-error">
                {getApiErrorMessage(mutationError)}
              </p>
            )}
          </form>
        </PermissionGuard>
      )}
    </div>
  );
}
