"use client";

import Link from "next/link";
import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Input } from "@/components/ui/Input";
import { LoadingState } from "@/components/ui/LoadingState";
import { Pagination } from "@/components/ui/Pagination";
import { Select } from "@/components/ui/Select";
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/Table";
import { PermissionGuard } from "@/components/guards/PermissionGuard";
import { getApiErrorMessage } from "@/lib/api-client";
import { usePatients } from "../hooks/usePatients";
import { useArchivePatient, useRestorePatient } from "../hooks/usePatientMutations";
import { ListPatientsParams } from "../types/patient.types";

// docs/02-design/pages/patient.md Section 12.3 "Patient List Actions": View,
// Edit, Archive are implemented (backed by task-028/029/030). Register
// Reservation, Upload Photo, and Export have no corresponding Phase 1 API
// and are intentionally not included.
export function PatientListView() {
  const [filters, setFilters] = useState<ListPatientsParams>({ page: 1, limit: 20 });
  const { data, isLoading, isError, error, refetch } = usePatients(filters);
  const archivePatient = useArchivePatient();
  const restorePatient = useRestorePatient();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-foreground">Patients</h1>
        <PermissionGuard permission="patient.create">
          <Link href="/patients/new">
            <Button>Register Patient</Button>
          </Link>
        </PermissionGuard>
      </div>

      <div className="flex flex-wrap gap-3">
        <Input
          placeholder="Search name, phone, MRN..."
          value={filters.search ?? ""}
          onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value || undefined, page: 1 }))}
          className="w-64"
        />
        <Select
          value={filters.status ?? ""}
          onChange={(e) => setFilters((f) => ({ ...f, status: (e.target.value || undefined) as "ACTIVE" | "ARCHIVED" | undefined, page: 1 }))}
        >
          <option value="">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="ARCHIVED">Archived</option>
        </Select>
        <Select
          value={filters.gender ?? ""}
          onChange={(e) => setFilters((f) => ({ ...f, gender: (e.target.value || undefined) as "MALE" | "FEMALE" | undefined, page: 1 }))}
        >
          <option value="">All genders</option>
          <option value="MALE">Male</option>
          <option value="FEMALE">Female</option>
        </Select>
      </div>

      {isLoading && <LoadingState label="Loading patients..." rows={5} columns={6} />}
      {isError && <ErrorState message={getApiErrorMessage(error)} onRetry={() => refetch()} />}
      {!isLoading && !isError && data && data.items.length === 0 && (
        <EmptyState title="No patients found" description="Try adjusting your search or filters." />
      )}
      {!isLoading && !isError && data && data.items.length > 0 && (
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>MRN</TableHeaderCell>
              <TableHeaderCell>Name</TableHeaderCell>
              <TableHeaderCell>Gender</TableHeaderCell>
              <TableHeaderCell>Phone</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell>Actions</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.items.map((patient) => (
              <TableRow key={patient.id}>
                <TableCell>{patient.medicalRecordNumber}</TableCell>
                <TableCell>{patient.fullName}</TableCell>
                <TableCell>{patient.gender === "MALE" ? "Male" : "Female"}</TableCell>
                <TableCell>{patient.phoneNumber}</TableCell>
                <TableCell>
                  <Badge tone={patient.status === "ACTIVE" ? "success" : "neutral"}>{patient.status}</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Link href={`/patients/${patient.id}`} className="text-sm font-medium text-primary hover:underline">
                      View
                    </Link>
                    <PermissionGuard permission="patient.update">
                      <Link href={`/patients/${patient.id}/edit`} className="text-sm font-medium text-primary hover:underline">
                        Edit
                      </Link>
                    </PermissionGuard>
                    <PermissionGuard permission="patient.archive">
                      {patient.status === "ACTIVE" ? (
                        <button
                          type="button"
                          className="text-sm font-medium text-error hover:underline disabled:opacity-50"
                          disabled={archivePatient.isPending}
                          onClick={() => archivePatient.mutate(patient.id)}
                        >
                          Archive
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="text-sm font-medium text-primary hover:underline disabled:opacity-50"
                          disabled={restorePatient.isPending}
                          onClick={() => restorePatient.mutate(patient.id)}
                        >
                          Restore
                        </button>
                      )}
                    </PermissionGuard>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      {data && <Pagination meta={data.meta} onPageChange={(page) => setFilters((f) => ({ ...f, page }))} />}
    </div>
  );
}
