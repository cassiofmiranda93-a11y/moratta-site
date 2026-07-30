import { FieldValue } from "firebase-admin/firestore";
import { COMPANY } from "@/constants/company";
import { getFirebaseAdminServices } from "@/server/firebaseAdmin";
import { cleanBrazilianPhone, distributeLeadAdmin, graphUrl, verifyMetaSignature } from "@/server/integrations";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");
  if (mode === "subscribe" && token && token === process.env.META_WEBHOOK_VERIFY_TOKEN) {
    return new Response(challenge ?? "", { status: 200 });
  }
  return new Response("Verificação recusada.", { status: 403 });
}

function fieldMap(fields: Array<{ name?: string; values?: string[] }>) {
  return Object.fromEntries(fields.map((field) => [String(field.name ?? ""), String(field.values?.[0] ?? "")]));
}

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    if (!verifyMetaSignature(rawBody, request.headers.get("x-hub-signature-256"))) {
      return Response.json({ error: "Assinatura inválida." }, { status: 401 });
    }

    const payload = JSON.parse(rawBody) as { entry?: Array<{ changes?: Array<{ field?: string; value?: { leadgen_id?: string; form_id?: string; page_id?: string; ad_id?: string; adgroup_id?: string; created_time?: number } }> }> };
    const { adminDb } = getFirebaseAdminServices();
    const organization = adminDb.collection("organizations").doc(COMPANY.organizationId);
    const crmSettings = (await organization.collection("settings").doc("crm").get()).data();
    const integrations = crmSettings?.integrations ?? {};
    let processed = 0;

    for (const entry of payload.entry ?? []) {
      for (const change of entry.changes ?? []) {
        if (change.field !== "leadgen") continue;
        const value = change.value ?? {};
        const leadgenId = String(value.leadgen_id ?? "");
        if (!leadgenId) continue;
        const allowedForms = Array.isArray(integrations.metaFormIds) ? integrations.metaFormIds.map(String) : [];
        if (allowedForms.length && !allowedForms.includes(String(value.form_id ?? ""))) continue;
        if (integrations.metaPageId && String(value.page_id ?? "") !== String(integrations.metaPageId)) continue;

        const leadRef = organization.collection("leads").doc(`meta_${leadgenId}`);
        if ((await leadRef.get()).exists) continue;

        const token = process.env.META_PAGE_ACCESS_TOKEN;
        if (!token) throw new Error("META_PAGE_ACCESS_TOKEN não configurado.");
        const response = await fetch(`${graphUrl(leadgenId, "META_GRAPH_API_VERSION")}?fields=id,created_time,field_data,form_id,ad_id&access_token=${encodeURIComponent(token)}`, { cache: "no-store" });
        if (!response.ok) throw new Error(`Meta Graph API respondeu ${response.status}.`);
        const detail = await response.json() as { created_time?: string; field_data?: Array<{ name?: string; values?: string[] }>; form_id?: string; ad_id?: string };
        const fields = fieldMap(detail.field_data ?? []);
        const fullName = fields.full_name || [fields.first_name, fields.last_name].filter(Boolean).join(" ") || "Lead Meta";
        const phone = cleanBrazilianPhone(fields.phone_number || fields.phone || "");

        await leadRef.set({
          name: fullName,
          phone,
          email: fields.email ?? "",
          city: fields.city ?? fields.cidade ?? "",
          propertyInterest: fields.property_interest ?? fields.empreendimento ?? fields.interesse ?? "",
          developmentId: "",
          propertyId: "",
          assignedTo: "",
          stage: "new",
          status: "active",
          source: "meta",
          campaign: String(value.ad_id ?? detail.ad_id ?? ""),
          utmSource: "meta",
          income: 0,
          fgts: 0,
          notes: "Lead recebido automaticamente pelo Meta Lead Ads.",
          nextContactAt: null,
          lastContactAt: null,
          externalId: leadgenId,
          metaFormId: String(value.form_id ?? detail.form_id ?? ""),
          metaPageId: String(value.page_id ?? ""),
          metaAdId: String(value.ad_id ?? detail.ad_id ?? ""),
          createdAt: detail.created_time ?? (value.created_time ? new Date(value.created_time * 1000).toISOString() : FieldValue.serverTimestamp()),
          updatedAt: FieldValue.serverTimestamp(),
          importedAt: FieldValue.serverTimestamp(),
        });

        await leadRef.collection("activities").add({
          type: "note",
          title: "Lead recebido pela Meta",
          description: `Formulário ${String(value.form_id ?? detail.form_id ?? "não informado")}`,
          dueAt: null,
          completed: true,
          createdAt: FieldValue.serverTimestamp(),
        });

        const assignedTo = integrations.autoDistributeMetaLeads !== false ? await distributeLeadAdmin(adminDb, leadRef.id) : "";
        await organization.collection("auditLogs").add({
          action: "Lead recebido pela Meta", entityType: "integration", entityId: leadRef.id, entityLabel: fullName,
          actorUid: "system", actorEmail: "meta-webhook", details: { leadgenId, formId: String(value.form_id ?? detail.form_id ?? ""), assignedTo },
          createdAt: FieldValue.serverTimestamp(),
        });
        processed += 1;
      }
    }

    return Response.json({ received: true, processed });
  } catch (error) {
    console.error("Meta webhook error", error);
    return Response.json({ error: error instanceof Error ? error.message : "Erro no webhook." }, { status: 500 });
  }
}
