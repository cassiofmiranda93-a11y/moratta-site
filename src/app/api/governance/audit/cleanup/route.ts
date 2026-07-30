import { Timestamp } from "firebase-admin/firestore";
import { COMPANY } from "@/constants/company";
import { apiError, requireApiUser } from "@/server/apiAuth";
import { getFirebaseAdminServices } from "@/server/firebaseAdmin";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const user = await requireApiUser(request, ["admin"]);
    const { adminDb } = getFirebaseAdminServices();
    const organization = adminDb.collection("organizations").doc(COMPANY.organizationId);
    const security = await organization.collection("settings").doc("security").get();
    const retentionDays = Math.min(3650, Math.max(30, Number(security.data()?.auditRetentionDays ?? 365)));
    const cutoff = Timestamp.fromMillis(Date.now() - retentionDays * 86_400_000);
    let deleted = 0;

    while (true) {
      const snapshot = await organization.collection("auditLogs").where("createdAt", "<", cutoff).limit(400).get();
      if (snapshot.empty) break;
      const batch = adminDb.batch();
      snapshot.docs.forEach((item) => batch.delete(item.ref));
      await batch.commit();
      deleted += snapshot.size;
      if (snapshot.size < 400) break;
    }

    await organization.collection("auditLogs").add({
      action: "Retenção da auditoria aplicada",
      entityType: "settings",
      entityId: "security",
      entityLabel: "Política de retenção",
      actorUid: user.uid,
      actorEmail: user.email,
      details: { retentionDays, deleted },
      createdAt: Timestamp.now(),
    });

    return Response.json({ deleted, retentionDays });
  } catch (error) {
    return apiError(error);
  }
}
