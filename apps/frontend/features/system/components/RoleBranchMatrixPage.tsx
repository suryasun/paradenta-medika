"use client";

import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingState } from "@/components/ui/LoadingState";
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/Table";
import { getApiErrorMessage } from "@/lib/api-client";
import { useRoleBranchMatrix } from "../hooks/useRoles";

// Phase 4, task-215 (docs/02-design/pages/system.md §9.3). Read-only --
// a user contributes one row per concurrent role+branch combination they
// hold, so a user with 2 roles across 2 branches produces up to 4 rows.
export function RoleBranchMatrixPage() {
  const { data, isLoading, isError, error, refetch } = useRoleBranchMatrix();

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-foreground">Role-Branch Matrix</h1>

      {isLoading && <LoadingState label="Loading matrix..." rows={5} columns={3} />}
      {isError && <ErrorState message={getApiErrorMessage(error)} onRetry={() => refetch()} />}
      {!isLoading && !isError && data && data.length === 0 && <EmptyState title="No role-branch assignments found" />}
      {!isLoading && !isError && data && data.length > 0 && (
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Role</TableHeaderCell>
              <TableHeaderCell>Branch</TableHeaderCell>
              <TableHeaderCell>User Count</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((entry) => (
              <TableRow key={`${entry.roleId}-${entry.branchId}`}>
                <TableCell className="font-medium">{entry.roleName}</TableCell>
                <TableCell>{entry.branchName}</TableCell>
                <TableCell className="font-tabular">{entry.userCount}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
