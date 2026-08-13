import type { WebsiteLeadRecord } from "@/types/admin";

export const LEAD_DISTRIBUTION_BATCH_SIZES = [20, 40, 60, 80, 100] as const;

export function selectUnassignedLeadIds(
  leads: readonly Pick<WebsiteLeadRecord, "id" | "assignedTo" | "stage">[],
  requestedSize: number,
) {
  const safeSize = Math.max(0, Math.floor(requestedSize));
  return leads
    .filter((lead) => !lead.assignedTo && lead.stage !== "lost")
    .slice(0, safeSize)
    .map((lead) => lead.id);
}
