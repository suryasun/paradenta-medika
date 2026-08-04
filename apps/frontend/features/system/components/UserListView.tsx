"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
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
import { branchService } from "@/features/master-data/services/branch.service";
import { useUsers } from "../hooks/useUsers";
import { ListUsersParams } from "../types/system.types";

export function UserListView() {
  const [filters, setFilters] = useState<ListUsersParams>({ page: 1, limit: 20 });
  const { data, isLoading, isError, error, refetch } = useUsers(filters);
  // Phase 4, task-214: cross-branch requesters see this filter as optional
  // narrowing; a branch-scoped requester's unfiltered request is already
  // auto-intersected server-side, so an empty/"All" selection here is safe.
  const { data: branchesData } = useQuery({
    queryKey: ["master-data", "branches", "options"],
    queryFn: () => branchService.list(),
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-foreground">Users</h1>
        <PermissionGuard permission="system.user.manage">
          <Link href="/system/users/new">
            <Button>New User</Button>
          </Link>
        </PermissionGuard>
      </div>

      <div className="flex gap-3">
        <Input
          placeholder="Search username / email..."
          value={filters.search ?? ""}
          onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value || undefined, page: 1 }))}
          className="w-64"
        />
        <Select
          aria-label="Filter by branch"
          value={filters.branchId ?? ""}
          onChange={(e) => setFilters((f) => ({ ...f, branchId: e.target.value || undefined, page: 1 }))}
        >
          <option value="">All Branches</option>
          {branchesData?.items.map((branch) => (
            <option key={branch.id} value={branch.id}>
              {branch.branchName}
            </option>
          ))}
        </Select>
      </div>

      {isLoading && <LoadingState label="Loading users..." />}
      {isError && <ErrorState message={getApiErrorMessage(error)} onRetry={() => refetch()} />}
      {!isLoading && !isError && data && data.items.length === 0 && <EmptyState title="No users found" />}
      {!isLoading && !isError && data && data.items.length > 0 && (
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Username</TableHeaderCell>
              <TableHeaderCell>Email</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell>Last Login</TableHeaderCell>
              <TableHeaderCell>Actions</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.items.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.username}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Badge tone={user.status === "ACTIVE" ? "success" : "neutral"}>{user.status}</Badge>
                </TableCell>
                <TableCell>{user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : "-"}</TableCell>
                <TableCell>
                  <Link href={`/system/users/${user.id}`} className="text-sm font-medium text-primary hover:underline">
                    Manage
                  </Link>
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
