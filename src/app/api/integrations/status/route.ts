import { requireApiUser, apiError } from "@/server/apiAuth";
import { isFirebaseAdminConfigured } from "@/server/firebaseAdmin";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    if (isFirebaseAdminConfigured()) await requireApiUser(request, ["admin"]);
    return Response.json({
      firebaseAdminConfigured: isFirebaseAdminConfigured(),
      metaConfigured: Boolean(process.env.META_APP_SECRET && process.env.META_PAGE_ACCESS_TOKEN && process.env.META_WEBHOOK_VERIFY_TOKEN && process.env.META_GRAPH_API_VERSION),
      whatsappConfigured: Boolean((process.env.WHATSAPP_APP_SECRET || process.env.META_APP_SECRET) && process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID && process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN && process.env.WHATSAPP_GRAPH_API_VERSION),
      metaWebhookPath: "/api/integrations/meta/webhook",
      whatsappWebhookPath: "/api/integrations/whatsapp/webhook",
    });
  } catch (error) {
    return apiError(error);
  }
}
