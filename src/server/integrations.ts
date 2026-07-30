import crypto from "node:crypto";
import { FieldValue, type Firestore } from "firebase-admin/firestore";
import { COMPANY } from "@/constants/company";

export function verifyMetaSignature(rawBody: string, signature: string | null, secret = process.env.META_APP_SECRET) {
  if (!secret || !signature?.startsWith("sha256=")) return false;
  const expected = `sha256=${crypto.createHmac("sha256", secret).update(rawBody).digest("hex")}`;
  const expectedBuffer = Buffer.from(expected);
  const signatureBuffer = Buffer.from(signature);
  return expectedBuffer.length === signatureBuffer.length && crypto.timingSafeEqual(expectedBuffer, signatureBuffer);
}

export function graphUrl(path: string, versionVariable: "META_GRAPH_API_VERSION" | "WHATSAPP_GRAPH_API_VERSION") {
  const version = process.env[versionVariable];
  if (!version) throw new Error(`Configure ${versionVariable}.`);
  return `https://graph.facebook.com/${version}/${path.replace(/^\//, "")}`;
}

export function cleanBrazilianPhone(value: string) {
  let digits = value.replace(/\D/g, "");
  if (digits.startsWith("55") && digits.length > 11) digits = digits.slice(2);
  return digits;
}

export async function distributeLeadAdmin(db: Firestore, leadId: string) {
  const organization = db.collection("organizations").doc(COMPANY.organizationId);
  const [membersSnapshot, settingsSnapshot, leadsSnapshot] = await Promise.all([
    organization.collection("members").where("active", "==", true).get(),
    organization.collection("settings").doc("crm").get(),
    organization.collection("leads").get(),
  ]);

  const settings = settingsSnapshot.data()?.distribution ?? {};
  let members = membersSnapshot.docs.filter((item) => item.data().role === "broker" && (!settings.respectAvailability || item.data().available !== false));
  if (!members.length) return "";

  const mode = settings.mode === "balanced" ? "balanced" : "round_robin";
  if (mode === "balanced") {
    members = members.sort((a, b) => {
      const countA = leadsSnapshot.docs.filter((lead) => lead.data().assignedTo === a.id && !["won", "lost"].includes(lead.data().stage)).length;
      const countB = leadsSnapshot.docs.filter((lead) => lead.data().assignedTo === b.id && !["won", "lost"].includes(lead.data().stage)).length;
      return countA - countB;
    });
  } else {
    const state = await organization.collection("settings").doc("leadDistribution").get();
    const lastBrokerId = String(state.data()?.lastBrokerId ?? "");
    const currentIndex = members.findIndex((member) => member.id === lastBrokerId);
    members = [...members.slice(currentIndex + 1), ...members.slice(0, currentIndex + 1)];
  }

  const selected = members[0];
  const batch = db.batch();
  batch.update(organization.collection("leads").doc(leadId), {
    assignedTo: selected.id,
    distributionMode: "integration",
    distributedAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });
  batch.set(organization.collection("settings").doc("leadDistribution"), {
    lastBrokerId: selected.id,
    lastDistributedAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });
  await batch.commit();
  return selected.id;
}
