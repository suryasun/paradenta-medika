import { useQuery } from "@tanstack/react-query";
import { doctorService } from "../services/doctor.service";

export function useDoctors(search?: string) {
  return useQuery({
    queryKey: ["doctors", "list", search ?? ""],
    queryFn: () => doctorService.list({ search }),
  });
}
