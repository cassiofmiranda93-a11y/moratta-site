import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  runTransaction,
  setDoc,
  serverTimestamp,
  updateDoc,
  writeBatch,
  type DocumentData,
  orderBy,
  query,
  where,
  limit,
} from "firebase/firestore";
import { auth, firestore, firebaseConfigurationError } from "@/config/firebase";
import { COMPANY } from "@/constants/company";
import type { AuditLogRecord, BrokerInput, BrokerRecord, CrmBackupData, CrmImportPreview, CrmImportResult, DistributionSettings, IntegrationSettings, LeadActivityRecord, OrganizationAccessRecord, SaleInput, SaleInstallmentRecord, SaleRecord, SecuritySettings, WebsiteLeadInput, WebsiteLeadRecord } from "@/types/admin";

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
    income: Number(data.income ?? 0),
    fgts: Number(data.fgts ?? 0),
    notes: String(data.notes ?? ""),
    nextContactAt: toIsoString(data.nextContactAt),
    lastContactAt: toIsoString(data.lastContactAt),
    createdAt: toIsoString(data.createdAt),
    updatedAt: toIsoString(data.updatedAt),
  };
}


function toInstallment(value: unknown, index: number): SaleInstallmentRecord {
  const data = value && typeof value === "object" ? value as Record<string, unknown> : {};
  return {
    id: String(data.id ?? `installment-${index + 1}`),
    description: String(data.description ?? `Parcela ${index + 1}`),
    amount: Number(data.amount ?? 0),
    expectedAt: String(data.expectedAt ?? ""),
    receivedAt: String(data.receivedAt ?? ""),
    receivedAmount: Number(data.receivedAmount ?? 0),
    status: (data.status ?? "pending") as SaleInstallmentRecord["status"],
  };
}

function toSale(data: DocumentData, id: string): SaleRecord {
  return {
    id,
    leadId: String(data.leadId ?? ""),
    clientName: String(data.clientName ?? ""),
    brokerId: String(data.brokerId ?? ""),
    developmentId: String(data.developmentId ?? ""),
    propertyId: String(data.propertyId ?? ""),
    saleDate: String(data.saleDate ?? ""),
    propertyValue: Number(data.propertyValue ?? 0),
    commissionPercent: Number(data.commissionPercent ?? 0),
    commissionValue: Number(data.commissionValue ?? 0),
    payerName: String(data.payerName ?? ""),
    invoiceExpectedAt: String(data.invoiceExpectedAt ?? ""),
    invoiceIssuedAt: String(data.invoiceIssuedAt ?? ""),
    invoiceNumber: String(data.invoiceNumber ?? ""),
    status: (data.status ?? "confirmed") as SaleRecord["status"],
    notes: String(data.notes ?? ""),
    installments: Array.isArray(data.installments) ? data.installments.map(toInstallment) : [],
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
    available: data.available !== false,
    specialties: Array.isArray(data.specialties) ? data.specialties.map(String) : [],
    cities: Array.isArray(data.cities) ? data.cities.map(String) : [],
    dailyLeadLimit: Number(data.dailyLeadLimit ?? 20),
    monthlyGoal: Number(data.monthlyGoal ?? 0),
    commissionRate: Number(data.commissionRate ?? 0),
    role: (data.role ?? "broker") as BrokerRecord["role"],
    createdAt: toIsoString(data.createdAt),
    updatedAt: toIsoString(data.updatedAt),
  };
}

export function subscribeToWebsiteLeads(onData: (items: WebsiteLeadRecord[]) => void, onError: (error: Error) => void, assignedTo?: string) {
  if (!firestore) return () => undefined;
  const source = assignedTo
    ? query(collection(firestore, ...base, "leads"), where("assignedTo", "==", assignedTo))
    : collection(firestore, ...base, "leads");
  return onSnapshot(
    source,
    (snapshot) => onData(snapshot.docs.map((item) => toLead(item.data(), item.id)).sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""))),
    onError,
  );
}

function cleanPhone(value: string) {
  let digits = value.replace(/\D/g, "");
  if (digits.startsWith("55") && digits.length > 11) digits = digits.slice(2);
  return digits;
}

function normalizeReference(value: string) {
  return value.trim().toLowerCase();
}

export async function createLead(input: WebsiteLeadInput) {
  const db = requireFirestore();
  const phone = cleanPhone(input.phone);
  if (input.name.trim().length < 2) throw new Error("Informe o nome do cliente.");
  if (phone.length < 10 || phone.length > 11) throw new Error("Informe um WhatsApp válido com DDD.");

  const existing = await getDocs(collection(db, ...base, "leads"));
  const duplicate = existing.docs.find((item) => cleanPhone(String(item.data().phone ?? "")) === phone);
  if (duplicate) throw new Error("Já existe um cliente cadastrado com este WhatsApp.");

  const { importedCreatedAt, ...lead } = input;
  const result = await addDoc(collection(db, ...base, "leads"), {
    ...lead,
    name: lead.name.trim(),
    phone,
    status: "active",
    source: lead.source || "manual",
    stage: lead.stage || "new",
    createdAt: importedCreatedAt || serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  await addDoc(collection(db, ...base, "leads", result.id, "activities"), {
    type: "note",
    title: "Cliente cadastrado manualmente",
    description: "Cadastro criado no painel administrativo.",
    dueAt: null,
    completed: true,
    createdAt: serverTimestamp(),
  });
  await writeAudit("Cliente cadastrado", "lead", result.id, lead.name, { source: lead.source, stage: lead.stage });
  return result.id;
}

export async function importCrmData(preview: CrmImportPreview): Promise<CrmImportResult> {
  if (preview.issues.length > 0) throw new Error("Corrija os erros da planilha antes de importar.");
  const db = requireFirestore();
  const [leadSnapshot, brokerSnapshot, saleSnapshot] = await Promise.all([
    getDocs(collection(db, ...base, "leads")),
    getDocs(collection(db, ...base, "members")),
    getDocs(collection(db, ...base, "sales")),
  ]);

  const leadByPhone = new Map<string, string>();
  leadSnapshot.docs.forEach((item) => {
    const phone = cleanPhone(String(item.data().phone ?? ""));
    if (phone) leadByPhone.set(phone, item.id);
  });

  const brokerByReference = new Map<string, string>();
  brokerSnapshot.docs.forEach((item) => {
    const data = item.data();
    brokerByReference.set(item.id, item.id);
    const email = normalizeReference(String(data.email ?? ""));
    const name = normalizeReference(String(data.name ?? ""));
    if (email) brokerByReference.set(email, item.id);
    if (name) brokerByReference.set(name, item.id);
  });

  let leadsCreated = 0;
  let leadsSkipped = 0;
  let batch = writeBatch(db);
  let operations = 0;

  const flush = async () => {
    if (!operations) return;
    await batch.commit();
    batch = writeBatch(db);
    operations = 0;
  };

  for (const item of preview.leads) {
    const phone = cleanPhone(item.lead.phone);
    if (leadByPhone.has(phone)) {
      leadsSkipped += 1;
      continue;
    }
    const ref = doc(collection(db, ...base, "leads"));
    const { importedCreatedAt, assignedTo: assignedReference, ...lead } = item.lead;
    const assignedTo = brokerByReference.get(normalizeReference(assignedReference)) ?? "";
    batch.set(ref, {
      ...lead,
      phone,
      assignedTo,
      distributionMode: assignedTo ? "import" : "unassigned",
      status: "active",
      createdAt: importedCreatedAt || serverTimestamp(),
      updatedAt: serverTimestamp(),
      importedAt: serverTimestamp(),
      importRow: item.rowNumber,
    });
    operations += 1;
    leadByPhone.set(phone, ref.id);
    leadsCreated += 1;
    if (operations >= 400) await flush();
  }
  await flush();

  const existingSaleKeys = new Set(saleSnapshot.docs.map((item) => {
    const data = item.data();
    return [String(data.leadId ?? ""), String(data.saleDate ?? ""), String(data.propertyId ?? ""), String(data.invoiceNumber ?? "")].join("|");
  }));

  let salesCreated = 0;
  let salesSkipped = 0;
  for (const item of preview.sales) {
    const leadId = leadByPhone.get(cleanPhone(item.clientPhone));
    if (!leadId) {
      salesSkipped += 1;
      continue;
    }
    const brokerId = brokerByReference.get(normalizeReference(item.brokerReference)) ?? "";
    const saleKey = [leadId, item.sale.saleDate, item.sale.propertyId, item.sale.invoiceNumber].join("|");
    if (existingSaleKeys.has(saleKey)) {
      salesSkipped += 1;
      continue;
    }

    const saleRef = doc(collection(db, ...base, "sales"));
    batch.set(saleRef, {
      ...item.sale,
      leadId,
      brokerId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      importedAt: serverTimestamp(),
      importRow: item.rowNumber,
    });
    batch.update(doc(db, ...base, "leads", leadId), {
      stage: "won",
      saleId: saleRef.id,
      updatedAt: serverTimestamp(),
    });
    operations += 2;
    existingSaleKeys.add(saleKey);
    salesCreated += 1;
    if (operations >= 400) await flush();
  }
  await flush();

  return { leadsCreated, leadsSkipped, salesCreated, salesSkipped };
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
    distributionMode: brokerId ? "manual" : "unassigned",
    updatedAt: serverTimestamp(),
  });
  await writeAudit("Responsável alterado", "lead", leadId, "Cliente", { brokerId });
}

export async function updateLeadStage(leadId: string, stage: string) {
  const db = requireFirestore();
  await updateDoc(doc(db, ...base, "leads", leadId), {
    stage,
    updatedAt: serverTimestamp(),
  });
  await addDoc(collection(db, ...base, "leads", leadId, "activities"), {
    type: "stage",
    title: "Etapa atualizada",
    description: stage,
    dueAt: null,
    completed: true,
    createdAt: serverTimestamp(),
  });
  await writeAudit("Etapa do cliente alterada", "lead", leadId, "Cliente", { stage });
}

export async function saveBroker(input: BrokerInput, id?: string) {
  const db = requireFirestore();
  const previous = id ? await getDoc(doc(db, ...base, "members", id)) : null;
  const previousEmail = String(previous?.data()?.email ?? "").toLowerCase();
  let memberId = id ?? "";
  if (id) {
    await updateDoc(doc(db, ...base, "members", id), {
      ...input,
      updatedAt: serverTimestamp(),
    });
  } else {
    const result = await addDoc(collection(db, ...base, "members"), {
      ...input,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    memberId = result.id;
  }

  const email = input.email.trim().toLowerCase();
  if (previousEmail && previousEmail !== email) await deleteDoc(doc(db, ...base, "access", previousEmail));
  if (email) {
    await setDoc(doc(db, ...base, "access", email), {
      email,
      memberId,
      role: input.role,
      active: input.active,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }, { merge: true });
  }
  await writeAudit(id ? "Integrante atualizado" : "Integrante cadastrado", "member", memberId, input.name, { email, role: input.role, active: input.active });
  return memberId;
}

export async function deleteBroker(id: string) {
  const db = requireFirestore();
  const leads = await getDocs(collection(db, ...base, "leads"));
  const assigned = leads.docs.filter((item) => String(item.data().assignedTo ?? "") === id);
  await Promise.all(assigned.map((item) => updateDoc(item.ref, { assignedTo: "", distributionMode: "unassigned", updatedAt: serverTimestamp() })));
  const member = await getDoc(doc(db, ...base, "members", id));
  const email = String(member.data()?.email ?? "").toLowerCase();
  await deleteDoc(doc(db, ...base, "members", id));
  if (email) await deleteDoc(doc(db, ...base, "access", email));
  await writeAudit("Integrante excluído", "member", id, String(member.data()?.name ?? "Integrante"), { email });
}

export async function toggleBroker(id: string, active: boolean) {
  const db = requireFirestore();
  const memberRef = doc(db, ...base, "members", id);
  const member = await getDoc(memberRef);
  await updateDoc(memberRef, { active, updatedAt: serverTimestamp() });
  const email = String(member.data()?.email ?? "").toLowerCase();
  if (email) await setDoc(doc(db, ...base, "access", email), { active, updatedAt: serverTimestamp() }, { merge: true });
  await writeAudit(active ? "Acesso ativado" : "Acesso desativado", "member", id, String(member.data()?.name ?? "Integrante"), { active });
}

export async function distributeLeadRoundRobin(leadId: string) {
  const db = requireFirestore();
  const [brokersSnapshot, crmSettings, allLeads] = await Promise.all([
    getDocs(collection(db, ...base, "members")),
    getDocs(collection(db, ...base, "settings")),
    getDocs(collection(db, ...base, "leads")),
  ]);
  const crmDoc = crmSettings.docs.find((item) => item.id === "crm")?.data();
  const distribution: DistributionSettings = { ...defaultDistribution, ...(crmDoc?.distribution ?? {}) };
  const leadSnapshot = allLeads.docs.find((item) => item.id === leadId);
  if (!leadSnapshot) throw new Error("Lead não encontrado.");
  const leadData = leadSnapshot.data();
  let activeBrokers = brokersSnapshot.docs.filter((item) => item.data().role === "broker" && item.data().active !== false);
  if (distribution.respectAvailability) activeBrokers = activeBrokers.filter((item) => item.data().available !== false);
  if (distribution.useCityMatching && leadData.city) {
    const cityMatches = activeBrokers.filter((item) => Array.isArray(item.data().cities) && item.data().cities.map(String).some((city: string) => city.toLowerCase() === String(leadData.city).toLowerCase()));
    if (cityMatches.length) activeBrokers = cityMatches;
  }
  if (distribution.useSpecialtyMatching && leadData.propertyInterest) {
    const specialtyMatches = activeBrokers.filter((item) => Array.isArray(item.data().specialties) && item.data().specialties.map(String).some((value: string) => String(leadData.propertyInterest).toLowerCase().includes(value.toLowerCase())));
    if (specialtyMatches.length) activeBrokers = specialtyMatches;
  }
  if (distribution.respectDailyLimit) {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    activeBrokers = activeBrokers.filter((broker) => {
      const limit = Number(broker.data().dailyLeadLimit ?? 20);
      const count = allLeads.docs.filter((lead) => String(lead.data().assignedTo ?? "") === broker.id && toIsoString(lead.data().distributedAt) && new Date(toIsoString(lead.data().distributedAt) as string) >= today).length;
      return limit <= 0 || count < limit;
    });
  }
  activeBrokers.sort((a, b) => String(a.data().name ?? "").localeCompare(String(b.data().name ?? "")));
  if (activeBrokers.length === 0) throw new Error("Nenhum corretor disponível atende às regras atuais de distribuição.");

  const settingsRef = doc(db, ...base, "settings", "leadDistribution");
  const leadRef = doc(db, ...base, "leads", leadId);

  return runTransaction(db, async (transaction) => {
    const [settings, lead] = await Promise.all([transaction.get(settingsRef), transaction.get(leadRef)]);
    if (!lead.exists()) throw new Error("Lead não encontrado.");
    if (String(lead.data().assignedTo ?? "")) return String(lead.data().assignedTo);

    let nextBroker = activeBrokers[0];
    if (distribution.mode === "balanced") {
      nextBroker = [...activeBrokers].sort((a, b) => {
        const totalA = allLeads.docs.filter((item) => String(item.data().assignedTo ?? "") === a.id && !["won", "lost"].includes(String(item.data().stage ?? "new"))).length;
        const totalB = allLeads.docs.filter((item) => String(item.data().assignedTo ?? "") === b.id && !["won", "lost"].includes(String(item.data().stage ?? "new"))).length;
        return totalA - totalB;
      })[0];
    } else {
      const lastBrokerId = settings.exists() ? String(settings.data().lastBrokerId ?? "") : "";
      const lastIndex = activeBrokers.findIndex((item) => item.id === lastBrokerId);
      nextBroker = activeBrokers[(lastIndex + 1) % activeBrokers.length];
    }

    transaction.update(leadRef, {
      assignedTo: nextBroker.id,
      distributionMode: "round_robin",
      distributedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    transaction.set(settingsRef, {
      lastBrokerId: nextBroker.id,
      lastDistributedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }, { merge: true });

    return nextBroker.id;
  });
}

export async function distributeUnassignedLeads(leadIds: string[]) {
  let distributed = 0;
  for (const leadId of leadIds) {
    await distributeLeadRoundRobin(leadId);
    distributed += 1;
  }
  return distributed;
}


export async function updateLeadProfile(leadId: string, data: Partial<Pick<WebsiteLeadRecord, "name" | "phone" | "email" | "city" | "propertyInterest" | "income" | "fgts" | "notes" | "nextContactAt" | "lastContactAt">>) {
  await updateDoc(doc(requireFirestore(), ...base, "leads", leadId), { ...data, updatedAt: serverTimestamp() });
  await writeAudit("Perfil do cliente atualizado", "lead", leadId, String(data.name ?? "Cliente"), { fields: Object.keys(data) });
}

function toActivity(data: DocumentData, id: string): LeadActivityRecord {
  return {
    id,
    type: (data.type ?? "note") as LeadActivityRecord["type"],
    title: String(data.title ?? "Atividade"),
    description: String(data.description ?? ""),
    dueAt: toIsoString(data.dueAt),
    completed: data.completed === true,
    createdAt: toIsoString(data.createdAt),
  };
}

export function subscribeToLeadActivities(leadId: string, onData: (items: LeadActivityRecord[]) => void, onError: (error: Error) => void) {
  if (!firestore) return () => undefined;
  const activities = query(collection(firestore, ...base, "leads", leadId, "activities"), orderBy("createdAt", "desc"));
  return onSnapshot(activities, (snapshot) => onData(snapshot.docs.map((item) => toActivity(item.data(), item.id))), onError);
}

export async function addLeadActivity(leadId: string, input: Omit<LeadActivityRecord, "id" | "createdAt">) {
  return addDoc(collection(requireFirestore(), ...base, "leads", leadId, "activities"), { ...input, createdAt: serverTimestamp() });
}

export async function toggleLeadActivity(leadId: string, activityId: string, completed: boolean) {
  await updateDoc(doc(requireFirestore(), ...base, "leads", leadId, "activities", activityId), { completed, updatedAt: serverTimestamp() });
}

const defaultDistribution: DistributionSettings = { mode: "round_robin", respectAvailability: true, respectDailyLimit: true, useCityMatching: false, useSpecialtyMatching: false };
const defaultIntegrations: IntegrationSettings = { metaEnabled: false, metaPageId: "", metaFormIds: [], autoDistributeMetaLeads: true, whatsappEnabled: false, whatsappNumber: "", whatsappDefaultMessage: "Olá, {nome}! Aqui é da Moratta Imóveis.", webhookUrl: "" };
const defaultSecurity: SecuritySettings = { strictAccess: false, auditRetentionDays: 365, requireRegisteredMember: true };

export function subscribeToCrmSettings(onData: (data: { distribution: DistributionSettings; integrations: IntegrationSettings }) => void, onError: (error: Error) => void) {
  if (!firestore) return () => undefined;
  return onSnapshot(doc(firestore, ...base, "settings", "crm"), (snapshot) => {
    const data = snapshot.data() ?? {};
    onData({
      distribution: { ...defaultDistribution, ...(data.distribution ?? {}) },
      integrations: { ...defaultIntegrations, ...(data.integrations ?? {}), metaFormIds: Array.isArray(data.integrations?.metaFormIds) ? data.integrations.metaFormIds.map(String) : [] },
    });
  }, onError);
}

export async function saveCrmSettings(distribution: DistributionSettings, integrations: IntegrationSettings) {
  const db = requireFirestore();
  await setDoc(doc(db, ...base, "settings", "crm"), { distribution, integrations, updatedAt: serverTimestamp() }, { merge: true });
  await writeAudit("Configurações do CRM atualizadas", "settings", "crm", "Distribuição e integrações", { distribution, integrations });
}


export function subscribeToSales(onData: (items: SaleRecord[]) => void, onError: (error: Error) => void, brokerId?: string) {
  if (!firestore) return () => undefined;
  const source = brokerId
    ? query(collection(firestore, ...base, "sales"), where("brokerId", "==", brokerId))
    : collection(firestore, ...base, "sales");
  return onSnapshot(
    source,
    (snapshot) => onData(snapshot.docs.map((item) => toSale(item.data(), item.id)).sort((a, b) => (b.saleDate || b.createdAt || "").localeCompare(a.saleDate || a.createdAt || ""))),
    onError,
  );
}

export async function saveSale(input: SaleInput, id?: string) {
  const db = requireFirestore();
  let saleId = id ?? "";
  if (id) {
    await setDoc(doc(db, ...base, "sales", id), { ...input, updatedAt: serverTimestamp() }, { merge: true });
  } else {
    const result = await addDoc(collection(db, ...base, "sales"), { ...input, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
    saleId = result.id;
  }
  if (input.leadId) {
    await updateDoc(doc(db, ...base, "leads", input.leadId), {
      stage: "won",
      saleId,
      updatedAt: serverTimestamp(),
    });
  }
  await writeAudit(id ? "Venda atualizada" : "Venda cadastrada", "sale", saleId, input.clientName, { status: input.status, commissionValue: input.commissionValue });
  return saleId;
}

export async function deleteSale(id: string) {
  const db = requireFirestore();
  const sale = await getDoc(doc(db, ...base, "sales", id));
  await deleteDoc(doc(db, ...base, "sales", id));
  await writeAudit("Venda excluída", "sale", id, String(sale.data()?.clientName ?? "Venda"));
}

function currentActor() {
  return {
    actorUid: auth?.currentUser?.uid ?? "",
    actorEmail: auth?.currentUser?.email?.toLowerCase() ?? "",
  };
}

async function writeAudit(action: string, entityType: AuditLogRecord["entityType"], entityId: string, entityLabel: string, details: Record<string, unknown> = {}) {
  try {
    const db = requireFirestore();
    const actor = currentActor();
    if (!actor.actorUid) return;
    await addDoc(collection(db, ...base, "auditLogs"), {
      action,
      entityType,
      entityId,
      entityLabel,
      details,
      ...actor,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.warn("Não foi possível registrar auditoria.", error);
  }
}

function toAccess(data: DocumentData, id: string): OrganizationAccessRecord {
  return {
    id,
    email: String(data.email ?? id),
    memberId: String(data.memberId ?? ""),
    role: (data.role ?? "broker") as OrganizationAccessRecord["role"],
    active: data.active !== false,
    createdAt: toIsoString(data.createdAt),
    updatedAt: toIsoString(data.updatedAt),
  };
}

function toAudit(data: DocumentData, id: string): AuditLogRecord {
  return {
    id,
    action: String(data.action ?? "Alteração"),
    entityType: (data.entityType ?? "settings") as AuditLogRecord["entityType"],
    entityId: String(data.entityId ?? ""),
    entityLabel: String(data.entityLabel ?? ""),
    actorUid: String(data.actorUid ?? ""),
    actorEmail: String(data.actorEmail ?? ""),
    details: data.details && typeof data.details === "object" ? data.details as Record<string, unknown> : {},
    createdAt: toIsoString(data.createdAt),
  };
}

export function subscribeToCurrentAccess(email: string, onData: (item: OrganizationAccessRecord | null) => void, onError: (error: Error) => void) {
  if (!firestore || !email) return () => undefined;
  return onSnapshot(doc(firestore, ...base, "access", email.toLowerCase()), (snapshot) => {
    onData(snapshot.exists() ? toAccess(snapshot.data(), snapshot.id) : null);
  }, onError);
}

export function subscribeToSecuritySettings(onData: (settings: SecuritySettings) => void, onError: (error: Error) => void) {
  if (!firestore) return () => undefined;
  return onSnapshot(doc(firestore, ...base, "settings", "security"), (snapshot) => {
    onData({ ...defaultSecurity, ...(snapshot.data() ?? {}) });
  }, onError);
}

export async function saveSecuritySettings(settings: SecuritySettings) {
  const db = requireFirestore();
  await setDoc(doc(db, ...base, "settings", "security"), { ...settings, updatedAt: serverTimestamp() }, { merge: true });
  await writeAudit("Configurações de segurança atualizadas", "settings", "security", "Segurança e permissões", settings as unknown as Record<string, unknown>);
}

export async function syncMemberAccessRecords() {
  const db = requireFirestore();
  const members = await getDocs(collection(db, ...base, "members"));
  const batch = writeBatch(db);
  let count = 0;
  members.docs.forEach((member) => {
    const data = member.data();
    const email = String(data.email ?? "").trim().toLowerCase();
    if (!email) return;
    batch.set(doc(db, ...base, "access", email), {
      email,
      memberId: member.id,
      role: data.role ?? "broker",
      active: data.active !== false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }, { merge: true });
    count += 1;
  });
  await batch.commit();
  await writeAudit("Acessos sincronizados", "settings", "access", "Equipe e acessos", { count });
  return count;
}

export function subscribeToAuditLogs(onData: (items: AuditLogRecord[]) => void, onError: (error: Error) => void, maxItems = 200) {
  if (!firestore) return () => undefined;
  const source = query(collection(firestore, ...base, "auditLogs"), orderBy("createdAt", "desc"), limit(maxItems));
  return onSnapshot(source, (snapshot) => onData(snapshot.docs.map((item) => toAudit(item.data(), item.id))), onError);
}

export async function createCrmBackup(): Promise<CrmBackupData> {
  const db = requireFirestore();
  const [leadSnapshot, brokerSnapshot, saleSnapshot, crmSnapshot, securitySnapshot] = await Promise.all([
    getDocs(collection(db, ...base, "leads")),
    getDocs(collection(db, ...base, "members")),
    getDocs(collection(db, ...base, "sales")),
    getDoc(doc(db, ...base, "settings", "crm")),
    getDoc(doc(db, ...base, "settings", "security")),
  ]);
  const crm = crmSnapshot.data() ?? {};
  const backup: CrmBackupData = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    organizationId: COMPANY.organizationId,
    leads: leadSnapshot.docs.map((item) => toLead(item.data(), item.id)),
    brokers: brokerSnapshot.docs.map((item) => toBroker(item.data(), item.id)),
    sales: saleSnapshot.docs.map((item) => toSale(item.data(), item.id)),
    settings: {
      distribution: { ...defaultDistribution, ...(crm.distribution ?? {}) },
      integrations: { ...defaultIntegrations, ...(crm.integrations ?? {}) },
      security: { ...defaultSecurity, ...(securitySnapshot.data() ?? {}) },
    },
  };
  await writeAudit("Backup exportado", "backup", backup.generatedAt, "Backup completo do CRM", {
    leads: backup.leads.length,
    brokers: backup.brokers.length,
    sales: backup.sales.length,
  });
  return backup;
}

export function subscribeToLeadSales(leadId: string, onData: (items: SaleRecord[]) => void, onError: (error: Error) => void) {
  if (!firestore) return () => undefined;
  const source = query(collection(firestore, ...base, "sales"), where("leadId", "==", leadId));
  return onSnapshot(source, (snapshot) => onData(snapshot.docs.map((item) => toSale(item.data(), item.id))), onError);
}
