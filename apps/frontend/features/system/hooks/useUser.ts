import { useQuery } from "@tanstack/react-query";
import { userService } from "../services/user.service";

export function useUser(userId: string) {
  return useQuery({
    queryKey: ["system", "users", "detail", userId],
    queryFn: () => userService.detail(userId),
    enabled: Boolean(userId),
  });
}
