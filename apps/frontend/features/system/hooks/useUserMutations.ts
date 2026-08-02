import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { userService } from "../services/user.service";
import { CreateUserInput } from "../types/system.types";

function invalidateUsers(queryClient: ReturnType<typeof useQueryClient>, userId?: string) {
  queryClient.invalidateQueries({ queryKey: ["system", "users", "list"] });
  if (userId) queryClient.invalidateQueries({ queryKey: ["system", "users", "detail", userId] });
}

export function useCreateUser() {
  const router = useRouter();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateUserInput) => userService.create(payload),
    onSuccess: (user) => {
      invalidateUsers(queryClient);
      router.push(`/system/users/${user.id}`);
    },
  });
}

export function useUpdateUserEmail(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (email: string) => userService.updateEmail(userId, email),
    onSuccess: () => invalidateUsers(queryClient, userId),
  });
}

export function useActivateUser(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => userService.activate(userId),
    onSuccess: () => invalidateUsers(queryClient, userId),
  });
}

export function useDeactivateUser(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => userService.deactivate(userId),
    onSuccess: () => invalidateUsers(queryClient, userId),
  });
}

export function useAssignRoles(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ roleIds, reason }: { roleIds: string[]; reason?: string }) => userService.assignRoles(userId, roleIds, reason),
    onSuccess: () => invalidateUsers(queryClient, userId),
  });
}

export function useRevokeSessions(userId: string) {
  return useMutation({
    mutationFn: (sessionId?: string) => userService.revokeSessions(userId, sessionId),
  });
}
