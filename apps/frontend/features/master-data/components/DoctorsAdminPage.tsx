"use client";

import { useQuery } from "@tanstack/react-query";
import { LoadingState } from "@/components/ui/LoadingState";
import { userService } from "@/features/system/services/user.service";
import { doctorService } from "../services/doctor.service";
import { branchService } from "../services/branch.service";
import { Doctor } from "../types/masterData.types";
import { FieldConfig } from "../lib/fieldConfig";
import { AdminEntityListPage } from "./AdminEntityListPage";

// docs/06-tasks/task-023.md: a Doctor wraps an existing System User
// account (1:1, task-015's users table) -- so this form picks from Users
// already created via System > Users, rather than creating one inline.
export function DoctorsAdminPage() {
  const { data: branchesData, isLoading: branchesLoading } = useQuery({
    queryKey: ["master-data", "branches", "options"],
    queryFn: () => branchService.list(),
  });
  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ["system", "users", "options"],
    queryFn: () => userService.list({ limit: 200 }),
  });

  if (branchesLoading || usersLoading) return <LoadingState label="Loading..." />;

  const fields: FieldConfig[] = [
    {
      name: "userId",
      label: "User Account",
      type: "select",
      required: true,
      createOnly: true,
      options: usersData?.items.map((user) => ({ value: user.id, label: `${user.username} (${user.email})` })) ?? [],
    },
    {
      name: "branchId",
      label: "Branch",
      type: "select",
      required: true,
      options: branchesData?.items.map((branch) => ({ value: branch.id, label: branch.branchName })) ?? [],
    },
    { name: "doctorCode", label: "Doctor Code", type: "text", required: true, createOnly: true },
    { name: "fullName", label: "Full Name", type: "text", required: true },
    { name: "specialization", label: "Specialization", type: "text" },
    { name: "sipNumber", label: "SIP Number", type: "text" },
    { name: "strNumber", label: "STR Number", type: "text" },
    { name: "consultationFee", label: "Consultation Fee", type: "number" },
    { name: "phone", label: "Phone", type: "text" },
    { name: "email", label: "Email", type: "text" },
  ];

  return (
    <AdminEntityListPage<Doctor>
      title="Doctors"
      resourceKey="doctors"
      permissionPrefix="masterdata.doctor"
      columns={[
        { key: "doctorCode", label: "Code" },
        { key: "fullName", label: "Name" },
        { key: "specialization", label: "Specialization" },
      ]}
      fields={fields}
      service={doctorService}
    />
  );
}
