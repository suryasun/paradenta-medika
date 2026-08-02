import { LoginForm } from "@/features/auth/components/LoginForm";

export default function LoginPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 bg-background px-4">
      <h1 className="text-2xl font-semibold text-primary">Parakita</h1>
      <LoginForm />
    </div>
  );
}
