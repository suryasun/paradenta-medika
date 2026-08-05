import { useQuery } from "@tanstack/react-query";
import { referralSourceService } from "../services/referralSource.service";

export function useReferralSources() {
  return useQuery({ queryKey: ["master-data", "referral-sources"], queryFn: () => referralSourceService.list() });
}
