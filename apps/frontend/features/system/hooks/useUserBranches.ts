import { useQuery } from "@tanstack/react-query";
import { userService } from "../services/user.service";

// Phase 4, task-211.
export function useUserBranches(userId: string) {
  return useQuery({
    queryKey: ["system", "users", "branches", userId],
    queryFn: () => userService.listBranches(userId),
    enabled: Boolean(userId),
  });
}
