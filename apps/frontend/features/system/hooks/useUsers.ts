import { useQuery } from "@tanstack/react-query";
import { userService } from "../services/user.service";
import { ListUsersParams } from "../types/system.types";

export function useUsers(params: ListUsersParams) {
  return useQuery({
    queryKey: ["system", "users", "list", params],
    queryFn: () => userService.list(params),
    placeholderData: (previous) => previous,
  });
}
