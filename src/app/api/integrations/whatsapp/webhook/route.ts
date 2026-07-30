import crypto from "node:crypto";
import { FieldValue } from "firebase-admin/firestore";
import { COMPANY } from "@/constants/company";
import { getFirebaseAdminServices } from "@/server/firebaseAdmin";
import { cleanBrazilianPhone, verifyMetaSignature } from "@/server/integrations";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  if (url.searchParams.get("hub.mode") === "subscribe" && url.searchParams.get("hub.verify_token") === process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN) {
    return new Response(url.searchParams.get("hub.challenge") ?? "", { status: 200 });
  }
  return new Response("Verificação recusada.", { status: 403 });
}

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    if (!verifyMetaSignature(rawBody, request.headers.get("x-hub-signature-256"), process.env.WHATSAPP_APP_SECRET || process.env.META_APP_SECRET)) return Response.json({ error: "Assinatura inválida." }, { status: 401 });
    const payload = JSON.parse(rawBody) as { entry?: Array<{ changes?: Array<{ value?: { messages?: Array<{ id?: string; from?: string; timestamp?: string; text?: { body?: string }; type?: string }>; statuses?: Array<{ id?: string; status?: string; timestamp?: string; recipient_id?: string }> } }> }> };
    const { adminDb } = getFirebaseAdminServices();
    const organization = adminDb.collection("organizations").doc(COMPANY.organizationId);

    for (const entry of payload.entry ?? []) for (const change of entry.changes ?? []) {
      for (const message of change.value?.messages ?? []) {
        const phone = cleanBrazilianPhone(String(message.from ?? ""));
        const leads = await organization.collection("leads").where("phone", "==", phone).limit(1).get();
        const leadId = leads.docs[0]?.id ?? "";
        const text = String(message.text?.body ?? `[Mensagem ${message.type ?? "desconhecida"}]`);
        await organization.collection("whatsappMessages").doc(String(message.id ?? crypto.randomUUID())).set({
          leadId, direction: "inbound", phone, message: text, externalId: String(message.id ?? ""), status: "received",
          createdAt: message.timestamp ? new Date(Number(message.timestamp) * 1000).toISOString() : FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp(),
        }, { merge: true });
        if (leadId) await organization.collection("leads").doc(leadId).collection("activities").add({
          type: "whatsapp", title: "Mensagem recebida no WhatsApp", description: text, dueAt: null, completed: true, createdAt: FieldValue.serverTimestamp(),
        });
      }
      for (const status of change.value?.statuses ?? []) {
        const messages = await organization.collection("whatsappMessages").where("externalId", "==", String(status.id ?? "")).limit(1).get();
        if (!messages.empty) await messages.docs[0].ref.update({ status: status.status ?? "unknown", updatedAt: FieldValue.serverTimestamp() });
      }
    }
    return Response.json({ received: true });
  } catch (error) {
    console.error("WhatsApp webhook error", error);
    return Response.json({ error: error instanceof Error ? error.message : "Erro no webhook." }, { status: 500 });
  }
}
