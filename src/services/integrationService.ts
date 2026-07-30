import { auth } from "@/config/firebase";
import type { IntegrationRuntimeStatus } from "@/types/admin";

async function authenticatedFetch(path: string, init?: RequestInit) {
  const user = auth?.currentUser;
  if (!user) throw new Error("Faça login novamente.");
  const token = await user.getIdToken();
  const response = await fetch(path, {
    ...init,
    headers: {
      ...(init?.headers ?? {}),
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  const data = await response.json().catch(() => ({})) as Record<string, unknown>;
  if (!response.ok) throw new Error(String(data.error ?? "Não foi possível concluir a integração."));
  return data;
}

export async function getIntegrationRuntimeStatus(): Promise<IntegrationRuntimeStatus> {
  const data = await authenticatedFetch("/api/integrations/status", { method: "GET" });
  return data as unknown as IntegrationRuntimeStatus;
}

export async function sendWhatsappFromCrm(input: { leadId: string; phone: string; message: string }) {
  return authenticatedFetch("/api/integrations/whatsapp/send", { method: "POST", body: JSON.stringify(input) });
}

export async function cleanupAuditLogs() {
  return authenticatedFetch("/api/governance/audit/cleanup", { method: "POST" }) as Promise<{ deleted: number; retentionDays: number }>;
}
