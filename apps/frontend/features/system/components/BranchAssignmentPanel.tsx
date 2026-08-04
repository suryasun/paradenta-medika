"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingState } from "@/components/ui/LoadingState";
import { PermissionGuard } from "@/components/guards/PermissionGuard";
import { getApiErrorMessage } from "@/lib/api-client";
import { branchService } from "@/features/master-data/services/branch.service";
import { useUserBranches } from "../hooks/useUserBranches";
import { useAssignBranches } from "../hooks/useUserMutations";
import { BranchAssignmentEntry } from "../types/system.types";

// Phase 4, task-210/211 (docs/02-design/pages/system.md §9.1).
export function BranchAssignmentPanel({ userId }: { userId: string }) {
  const { data: branches, isLoading: branchesLoading } = useQuery({
    queryKey: ["master-data", "branches", "options"],
    queryFn: () => branchService.list(),
  });
  const { data: assignments, isLoading: assignmentsLoading, isError, error, refetch } = useUserBranches(userId);
  const assignBranches = useAssignBranches(userId);

  const [selected, setSelected] = useState<BranchAssignmentEntry[]>([]);
  const [syncedAssignments, setSyncedAssignments] = useState(assignments);

  // React-docs "adjusting state when a prop changes" pattern (setState
  // during render, not in an effect) -- matches UserDetailView's own
  // roleIds sync, avoids a blank-checklist flash on first paint.
  if (assignments && assignments !== syncedAssignments) {
    setSyncedAssignments(assignments);
    setSelected(assignments.map((a) => ({ branchId: a.branchId, isDefault: a.isDefault, effectiveFrom: a.effectiveFrom ?? undefined })));
  }

  function toggleBranch(branchId: string) {
    setSelected((prev) => {
      const exists = prev.find((a) => a.branchId === branchId);
      if (exists) return prev.filter((a) => a.branchId !== branchId);
      return [...prev, { branchId, isDefault: prev.length === 0 }];
    });
  }

  function setDefault(branchId: string) {
    setSelected((prev) => prev.map((a) => ({ ...a, isDefault: a.branchId === branchId })));
  }

  const isLoading = branchesLoading || assignmentsLoading;
  const hasExactlyOneDefault = selected.length > 0 && selected.filter((a) => a.isDefault).length === 1;

  return (
    <PermissionGuard permission="system.user.branch.manage">
      <div className="flex flex-col gap-3 rounded-lg border border-border p-4">
        <span className="text-sm font-medium text-foreground">Branch Assignments</span>

        {isLoading && <LoadingState label="Loading branches..." rows={3} columns={1} />}
        {isError && <ErrorState message={getApiErrorMessage(error)} onRetry={() => refetch()} />}

        {!isLoading && !isError && branches && (
          <div className="flex flex-col gap-2">
            {branches.items.map((branch) => {
              const entry = selected.find((a) => a.branchId === branch.id);
              return (
                <label key={branch.id} className="flex items-center gap-3 text-sm text-foreground">
                  <input type="checkbox" checked={Boolean(entry)} onChange={() => toggleBranch(branch.id)} />
                  {branch.branchName}
                  {entry && (
                    <label className="flex items-center gap-1 text-xs text-muted">
                      <input type="radio" name="default-branch" checked={entry.isDefault} onChange={() => setDefault(branch.id)} />
                      Default
                    </label>
                  )}
                </label>
              );
            })}
          </div>
        )}

        {selected.length > 0 && !hasExactlyOneDefault && (
          <p role="alert" className="text-sm text-error">
            Exactly one branch must be marked as Default.
          </p>
        )}
        {assignBranches.isError && (
          <p role="alert" className="text-sm text-error">
            {getApiErrorMessage(assignBranches.error)}
          </p>
        )}

        <Button
          isLoading={assignBranches.isPending}
          disabled={selected.length === 0 || !hasExactlyOneDefault}
          onClick={() => assignBranches.mutate(selected)}
          className="self-start"
        >
          Save Assignments
        </Button>
      </div>
    </PermissionGuard>
  );
}
