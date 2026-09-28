import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { firestore, firebaseConfigurationError } from "@/config/firebase";
import { COMPANY } from "@/constants/company";
import { normalizePhone } from "@/lib/catalog";

export type WebsiteLeadPayload = {
  name: string;
  phone: string;
  email?: string;
  city?: string;
  propertyInterest?: string;
  developmentId?: string;
  propertyId?: string;
  message?: string;
  campaign?: string;
  adSet?: string;
  ad?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
  landingPage?: string;
  monthlyIncome?: number;
  hasFgts?: boolean;
  employmentType?: string;
  source?: string;
};

export function validateWebsiteLead(payload: WebsiteLeadPayload) {
  const errors: string[] = [];
  if (!payload.name.trim()) errors.push("Informe seu nome.");
  if (normalizePhone(payload.phone).length < 10) errors.push("Informe um telefone com DDD.");
  return { valid: errors.length === 0, errors };
}

export async function createWebsiteLead(payload: WebsiteLeadPayload) {
  if (!firestore) throw new Error(firebaseConfigurationError ?? "Firestore indisponível.");
  const validation = validateWebsiteLead(payload);
  if (!validation.valid) throw new Error(validation.errors.join(" "));

  const phone = normalizePhone(payload.phone);
  const leadRef = doc(firestore, "organizations", COMPANY.organizationId, "leads", phone);
  await setDoc(leadRef, {
    name: payload.name.trim(),
    phone,
    email: payload.email?.trim() ?? "",
    city: payload.city?.trim() ?? "",
    monthlyIncome: payload.monthlyIncome ?? null,
    employmentType: payload.employmentType ?? null,
    hasFgts: payload.hasFgts ?? false,
    dependents: 0,
    propertyInterest: payload.propertyInterest?.trim() ?? "",
    developmentId: payload.developmentId ?? "",
    propertyId: payload.propertyId ?? "",
    source: payload.source?.trim() || "site",
    campaign: payload.campaign?.trim() ?? "",
    adSet: payload.adSet?.trim() ?? "",
    ad: payload.ad?.trim() ?? "",
    utmSource: payload.utmSource?.trim() ?? "",
    utmMedium: payload.utmMedium?.trim() ?? "",
    utmCampaign: payload.utmCampaign?.trim() ?? "",
    utmContent: payload.utmContent?.trim() ?? "",
    utmTerm: payload.utmTerm?.trim() ?? "",
    landingPage: payload.landingPage?.trim() ?? "",
    assignedTo: "",
    stage: "new",
    nextFollowUpAt: null,
    firstContactAt: null,
    lastContactAt: null,
    estimatedCommission: null,
    tags: [payload.source?.trim() || "site"],
    favorite: false,
    notes: payload.message?.trim() ?? "",
    status: "active",
    deletedAt: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return phone;
}
