import { FieldValue } from "firebase-admin/firestore";
import { COMPANY } from "@/constants/company";
import { requireApiUser, apiError } from "@/server/apiAuth";
import { getFirebaseAdminServices } from "@/server/firebaseAdmin";
import { cleanBrazilianPhone, graphUrl } from "@/server/integrations";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const user = await requireApiUser(request, ["admin", "manager", "broker"]);
    const body = await request.json() as { leadId?: string; phone?: string; message?: string };
    const leadId = String(body.leadId ?? "");
    const phone = cleanBrazilianPhone(String(body.phone ?? ""));
    const message = String(body.message ?? "").trim();
    if (!leadId || phone.length < 10 || !message) return Response.json({ error: "Lead, telefone e mensagem são obrigatórios." }, { status: 400 });

    const { adminDb } = getFirebaseAdminServices();
    const organization = adminDb.collection("organizations").doc(COMPANY.organizationId);
    const leadRef = organization.collection("leads").doc(leadId);
    const lead = await leadRef.get();
    if (!lead.exists) return Response.json({ error: "Lead não encontrado." }, { status: 404 });
    if (user.role === "broker" && lead.data()?.assignedTo !== user.memberId) return Response.json({ error: "Este cliente não pertence à sua carteira." }, { status: 403 });

    const token = process.env.WHATSAPP_ACCESS_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    if (!token || !phoneNumberId) throw new Error("WhatsApp Cloud API não configurada.");

    const response = await fetch(graphUrl(`${phoneNumberId}/messages`, "WHATSAPP_GRAPH_API_VERSION"), {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ messaging_product: "whatsapp", recipient_type: "individual", to: `55${phone}`, type: "text", text: { preview_url: false, body: message } }),
    });
    const result = await response.json() as { messages?: Array<{ id?: string }>; error?: { message?: string } };
    if (!response.ok) throw new Error(result.error?.message ?? `WhatsApp respondeu ${response.status}.`);

    await Promise.all([
      organization.collection("whatsappMessages").add({
        leadId, direction: "outbound", phone, message, externalId: result.messages?.[0]?.id ?? "", status: "sent",
        actorUid: user.uid, actorEmail: user.email, createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp(),
      }),
      leadRef.collection("activities").add({
        type: "whatsapp", title: "Mensagem enviada pelo CRM", description: message, dueAt: null, completed: true, createdAt: FieldValue.serverTimestamp(),
      }),
      organization.collection("auditLogs").add({
        action: "Mensagem enviada pelo WhatsApp", entityType: "integration", entityId: leadId, entityLabel: String(lead.data()?.name ?? "Cliente"),
        actorUid: user.uid, actorEmail: user.email, details: { messageId: result.messages?.[0]?.id ?? "" }, createdAt: FieldValue.serverTimestamp(),
      }),
    ]);

    return Response.json({ sent: true, messageId: result.messages?.[0]?.id ?? "" });
  } catch (error) {
    return apiError(error);
  }
}
