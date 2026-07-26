import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  serverTimestamp,
  updateDoc,
  type DocumentData,
} from "firebase/firestore";
import { firestore, firebaseConfigurationError } from "@/config/firebase";
import { COMPANY } from "@/constants/company";
import type { BrokerInput, BrokerRecord, WebsiteLeadRecord } from "@/types/admin";

const base = ["organizations", COMPANY.organizationId] as const;

function requireFirestore() {
  if (!firestore) throw new Error(firebaseConfigurationError ?? "Firestore indisponível.");
  return firestore;
}

function toIsoString(value: unknown) {
  if (value && typeof value === "object" && "toDate" in value && typeof value.toDate === "function") {
    return value.toDate().toISOString();
  }
  return typeof value === "string" ? value : null;
}

function toLead(data: DocumentData, id: string): WebsiteLeadRecord {
  return {
    id,
    name: String(data.name ?? ""),
    phone: String(data.phone ?? ""),
    email: String(data.email ?? ""),
    city: String(data.city ?? ""),
    propertyInterest: String(data.propertyInterest ?? ""),
    developmentId: String(data.developmentId ?? ""),
    propertyId: String(data.propertyId ?? ""),
    assignedTo: String(data.assignedTo ?? ""),
    stage: String(data.stage ?? "new"),
    source: String(data.source ?? "site"),
    campaign: String(data.campaign ?? data.utmCampaign ?? ""),
    utmSource: String(data.utmSource ?? ""),
    createdAt: toIsoString(data.createdAt),
    updatedAt: toIsoString(data.updatedAt),
  };
}

function toBroker(data: DocumentData, id: string): BrokerRecord {
  return {
    id,
    name: String(data.name ?? ""),
    email: String(data.email ?? ""),
    phone: String(data.phone ?? ""),
    creci: String(data.creci ?? ""),
    active: data.active !== false,
    createdAt: toIsoString(data.createdAt),
    updatedAt: toIsoString(data.updatedAt),
  };
}

export function subscribeToWebsiteLeads(onData: (items: WebsiteLeadRecord[]) => void, onError: (error: Error) => void) {
  if (!firestore) return () => undefined;
  return onSnapshot(
    collection(firestore, ...base, "leads"),
    (snapshot) => onData(snapshot.docs.map((item) => toLead(item.data(), item.id)).sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""))),
    onError,
  );
}

export function subscribeToBrokers(onData: (items: BrokerRecord[]) => void, onError: (error: Error) => void) {
  if (!firestore) return () => undefined;
  return onSnapshot(
    collection(firestore, ...base, "members"),
    (snapshot) => onData(snapshot.docs.map((item) => toBroker(item.data(), item.id)).sort((a, b) => a.name.localeCompare(b.name))),
    onError,
  );
}

export async function assignLead(leadId: string, brokerId: string) {
  await updateDoc(doc(requireFirestore(), ...base, "leads", leadId), {
    assignedTo: brokerId,
    updatedAt: serverTimestamp(),
  });
}

export async function updateLeadStage(leadId: string, stage: string) {
  await updateDoc(doc(requireFirestore(), ...base, "leads", leadId), {
    stage,
    updatedAt: serverTimestamp(),
  });
}

export async function saveBroker(input: BrokerInput) {
  return addDoc(collection(requireFirestore(), ...base, "members"), {
    ...input,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function toggleBroker(id: string, active: boolean) {
  await updateDoc(doc(requireFirestore(), ...base, "members", id), {
    active,
    updatedAt: serverTimestamp(),
  });
}
