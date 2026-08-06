"use client";

import { useQuery } from "@tanstack/react-query";
import { Select } from "@/components/ui/Select";
import { useReferralSources } from "@/features/master-data/hooks/useReferralSources";
import { userService } from "@/features/system/services/user.service";

// task-297 (Reservation Module Addendum #2, R2): extracted from PatientForm
// (task-287, Epic PE4) so the same referral-source + conditional
// "staff who referred" picker logic can be reused by
// QuickNewPatientCallModal without duplicating the requiresReferrer
// lookup/staff-query wiring. Per docs/02-design/pages/patient.md §14, the
// staff picker is hidden entirely (not just disabled) unless the selected
// source has requiresReferrer:true.
export function ReferralSourceFields({
  referralSourceId,
  referredByUserId,
  onReferralSourceChange,
  onReferredByUserChange,
}: {
  referralSourceId: string;
  referredByUserId: string;
  onReferralSourceChange: (value: string) => void;
  onReferredByUserChange: (value: string) => void;
}) {
  const { data: referralSources } = useReferralSources();
  const selectedReferralSource = referralSources?.find((source) => source.id === referralSourceId);
  const { data: staffUsers } = useQuery({
    queryKey: ["system", "users", "referrer-picker"],
    queryFn: () => userService.list({ limit: 100 }),
    enabled: Boolean(selectedReferralSource?.requiresReferrer),
  });

  return (
    <>
      <Select
        id="referralSourceId"
        label="Dari mana Anda mengetahui klinik kami?"
        value={referralSourceId}
        onChange={(e) => {
          onReferralSourceChange(e.target.value);
          onReferredByUserChange("");
        }}
      >
        <option value="">Pilih sumber...</option>
        {referralSources?.map((source) => (
          <option key={source.id} value={source.id}>
            {source.referralSourceName}
          </option>
        ))}
      </Select>
      {selectedReferralSource?.requiresReferrer && (
        <Select
          id="referredByUserId"
          label="Staf yang merujuk"
          value={referredByUserId}
          onChange={(e) => onReferredByUserChange(e.target.value)}
        >
          <option value="">Pilih staf...</option>
          {staffUsers?.items.map((user) => (
            <option key={user.id} value={user.id}>
              {user.username}
            </option>
          ))}
        </Select>
      )}
    </>
  );
}
