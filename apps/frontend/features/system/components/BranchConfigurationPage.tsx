"use client";

import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingState } from "@/components/ui/LoadingState";
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/Table";
import { getApiErrorMessage } from "@/lib/api-client";
import { branchService } from "@/features/master-data/services/branch.service";
import { useBranchConfiguration } from "../hooks/useBranchConfiguration";

// Phase 4, task-213 (docs/02-design/pages/master-data.md §10.2).
// Read-only -- changing a value happens through the existing System
// Parameters screen, this is a per-branch consolidated view only.
export function BranchConfigurationPage({ branchId }: { branchId: string }) {
  const { data: branch } = useQuery({
    queryKey: ["master-data", "branches", "detail", branchId],
    queryFn: () => branchService.get(branchId),
  });
  const { data, isLoading, isError, error, refetch } = useBranchConfiguration(branchId);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-foreground">Configuration{branch ? ` — ${branch.branchName}` : ""}</h1>

      {isLoading && <LoadingState label="Loading configuration..." rows={5} columns={4} />}
      {isError && <ErrorState message={getApiErrorMessage(error)} onRetry={() => refetch()} />}
      {!isLoading && !isError && data && data.length === 0 && <EmptyState title="No configuration entries found" />}
      {!isLoading && !isError && data && data.length > 0 && (
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Key</TableHeaderCell>
              <TableHeaderCell>Value</TableHeaderCell>
              <TableHeaderCell>Type</TableHeaderCell>
              <TableHeaderCell>Source</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((entry) => (
              <TableRow key={entry.key}>
                <TableCell className="font-medium">{entry.key}</TableCell>
                <TableCell className="font-tabular">{entry.value}</TableCell>
                <TableCell>{entry.valueType}</TableCell>
                <TableCell>
                  <Badge tone={entry.source === "BRANCH" ? "info" : "neutral"}>{entry.source}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
