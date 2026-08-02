import { CreateUserForm } from "@/features/system/components/CreateUserForm";

export default function NewSystemUserPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold text-foreground">New User</h1>
      <CreateUserForm />
    </div>
  );
}
