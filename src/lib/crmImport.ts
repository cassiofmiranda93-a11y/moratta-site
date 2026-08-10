import { normalizeCampaign, normalizeCity, normalizeEmail, normalizeLeadPhone, normalizePersonName, normalizePropertyInterest } from "./leadText.ts";
import type {
  CrmImportIssue,
  CrmImportPreview,
  LeadImportRow,
  SaleImportRow,
  SaleInstallmentRecord,
  SaleStatus,
  WebsiteLeadInput,
} from "@/types/admin";

const STAGE_ALIASES: Record<string, string> = {
  new: "new",
  "novo lead": "new",
  contacted: "contacted",
  "contato realizado": "contacted",
  documents: "documents",
  documentacao: "documents",
  "analise de credito": "credit_analysis",
  credit_analysis: "credit_analysis",
  approved: "approved",
  aprovado: "approved",
  visit: "visit",
  visita: "visit",
  proposal: "proposal",
  proposta: "proposal",
  reserved: "reserved",
  reserva: "reserved",
  contract: "contract",
  contrato: "contract",
  won: "won",
  "venda concluida": "won",
  lost: "lost",
  perdido: "lost",
};

const SALE_STATUS_ALIASES: Record<string, SaleStatus> = {
  confirmed: "confirmed",
  "venda confirmada": "confirmed",
  awaiting_documents: "awaiting_documents",
  "aguardando documentacao": "awaiting_documents",
  awaiting_invoice: "awaiting_invoice",
  "aguardando emissao da nota": "awaiting_invoice",
  invoice_issued: "invoice_issued",
  "nota fiscal emitida": "invoice_issued",
  payment_scheduled: "payment_scheduled",
  "pagamento programado": "payment_scheduled",
  partially_received: "partially_received",
  "recebido parcialmente": "partially_received",
  received: "received",
  recebido: "received",
  overdue: "overdue",
  "pagamento atrasado": "overdue",
  cancelled: "cancelled",
  cancelado: "cancelled",
};

const INSTALLMENT_STATUS_ALIASES: Record<string, SaleInstallmentRecord["status"]> = {
  pending: "pending",
  pendente: "pending",
  scheduled: "scheduled",
  programado: "scheduled",
  partial: "partial",
  parcial: "partial",
  received: "received",
  recebido: "received",
  overdue: "overdue",
  atrasado: "overdue",
  cancelled: "cancelled",
  cancelado: "cancelled",
};

function cleanText(value: unknown) {
  return String(value ?? "").trim();
}

export function normalizeImportKey(value: unknown) {
  return cleanText(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\*/g, "")
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .trim()
    .toLowerCase();
}

export function normalizePhone(value: unknown) {
  return normalizeLeadPhone(value);
}

function normalizedRow(row: Record<string, unknown>) {
  return Object.entries(row).reduce<Record<string, unknown>>((result, [key, value]) => {
    result[normalizeImportKey(key)] = value;
    return result;
  }, {});
}

function pick(row: Record<string, unknown>, ...aliases: string[]) {
  for (const alias of aliases) {
    const value = row[normalizeImportKey(alias)];
    if (value !== undefined && value !== null && cleanText(value) !== "") return value;
  }
  return "";
}

export function parseMoney(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const raw = cleanText(value).replace(/R\$/gi, "").replace(/\s/g, "");
  if (!raw) return 0;
  const normalized = raw.includes(",")
    ? raw.replace(/\./g, "").replace(",", ".")
    : raw;
  const parsed = Number(normalized.replace(/[^0-9.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

export function parsePercent(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value > 1 ? value / 100 : value;
  const raw = cleanText(value);
  if (!raw) return 0;
  const parsed = parseMoney(raw);
  return raw.includes("%") || parsed > 1 ? parsed / 100 : parsed;
}

function excelSerialToDate(serial: number) {
  const milliseconds = Math.round((serial - 25569) * 86400 * 1000);
  return new Date(milliseconds);
}

export function parseImportDate(value: unknown, includeTime = false) {
  if (!value) return "";
  let date: Date | null = null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) date = value;
  else if (typeof value === "number" && value > 1000) date = excelSerialToDate(value);
  else {
    const raw = cleanText(value);
    const br = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:[ T](\d{1,2}):(\d{2}))?/);
    if (br) {
      date = new Date(Number(br[3]), Number(br[2]) - 1, Number(br[1]), Number(br[4] ?? 12), Number(br[5] ?? 0));
    } else {
      const parsed = new Date(raw);
      if (!Number.isNaN(parsed.getTime())) date = parsed;
    }
  }
  if (!date || Number.isNaN(date.getTime())) return "";
  if (includeTime) {
    const offset = date.getTimezoneOffset() * 60_000;
    return new Date(date.getTime() - offset).toISOString().slice(0, 16);
  }
  return date.toISOString().slice(0, 10);
}

function stageCode(value: unknown) {
  return STAGE_ALIASES[normalizeImportKey(value)] ?? "";
}

function saleStatusCode(value: unknown): SaleStatus {
  return SALE_STATUS_ALIASES[normalizeImportKey(value)] ?? "confirmed";
}

function installmentStatusCode(value: unknown): SaleInstallmentRecord["status"] {
  return INSTALLMENT_STATUS_ALIASES[normalizeImportKey(value)] ?? "pending";
}

function sourceCode(value: unknown) {
  const normalized = normalizeImportKey(value);
  const known: Record<string, string> = {
    "carteira antiga": "carteira_antiga",
    indicacao: "indicacao",
    site: "site",
    "meta facebook": "meta",
    instagram: "instagram",
    whatsapp: "whatsapp",
    plantao: "plantao",
    construtora: "construtora",
    ligacao: "ligacao",
    outro: "outro",
  };
  return known[normalized] ?? (cleanText(value).toLowerCase().replace(/\s+/g, "_") || "carteira_antiga");
}

function issue(sheet: CrmImportIssue["sheet"], row: number, field: string, message: string): CrmImportIssue {
  return { sheet, row, field, message };
}

export function buildCrmImportPreview(
  rawClientRows: Record<string, unknown>[],
  rawSaleRows: Record<string, unknown>[] = [],
): CrmImportPreview {
  const issues: CrmImportIssue[] = [];
  const leads: LeadImportRow[] = [];
  const seenPhones = new Set<string>();

  rawClientRows.forEach((raw, index) => {
    const rowNumber = Number(raw.__rowNumber ?? index + 2);
    const row = normalizedRow(raw);
    const name = normalizePersonName(pick(row, "Nome completo", "Nome", "Cliente"));
    const phone = normalizePhone(pick(row, "WhatsApp com DDD", "WhatsApp", "Telefone", "Celular"));
    const stageRaw = pick(row, "Etapa atual", "Etapa", "Status");
    const stage = cleanText(stageRaw) ? stageCode(stageRaw) : "new";

    if (!name && !phone) return;
    if (name.length < 2) issues.push(issue("Clientes", rowNumber, "Nome", "Informe o nome completo do cliente."));
    if (phone.length < 10 || phone.length > 11) issues.push(issue("Clientes", rowNumber, "WhatsApp", "Informe DDD + número com 10 ou 11 dígitos."));
    if (cleanText(stageRaw) && !stage) issues.push(issue("Clientes", rowNumber, "Etapa", `Etapa não reconhecida: ${cleanText(stageRaw)}.`));
    if (phone && seenPhones.has(phone)) issues.push(issue("Clientes", rowNumber, "WhatsApp", "Este telefone está repetido na própria planilha."));
    if (phone) seenPhones.add(phone);

    const createdDate = parseImportDate(pick(row, "Data de entrada", "Criado em"));
    const lastContactDate = parseImportDate(pick(row, "Último contato", "Ultimo contato"), true);
    const nextContactDate = parseImportDate(pick(row, "Próximo retorno", "Proximo retorno"), true);

    const lead: WebsiteLeadInput = {
      name,
      phone,
      email: normalizeEmail(pick(row, "E-mail", "Email")),
      city: normalizeCity(pick(row, "Cidade")),
      propertyInterest: normalizePropertyInterest(pick(row, "Empreendimento / imóvel de interesse", "Empreendimento", "Interesse", "Imóvel")),
      developmentId: cleanText(pick(row, "ID do empreendimento", "Development ID")),
      propertyId: cleanText(pick(row, "ID do imóvel / unidade", "ID do imovel", "Property ID", "Unidade")),
      assignedTo: cleanText(pick(row, "Corretor responsável", "Corretor", "Responsável")),
      stage: stage || "new",
      source: sourceCode(pick(row, "Origem do lead", "Origem")),
      campaign: normalizeCampaign(pick(row, "Campanha / anúncio", "Campanha", "Anúncio")),
      utmSource: cleanText(pick(row, "UTM / fonte", "UTM", "Fonte")),
      income: parseMoney(pick(row, "Renda familiar mensal", "Renda")),
      fgts: parseMoney(pick(row, "FGTS disponível", "FGTS")),
      notes: cleanText(pick(row, "Observações", "Observacao", "Notas")),
      nextContactAt: nextContactDate || null,
      lastContactAt: lastContactDate || null,
      importedCreatedAt: createdDate || null,
    };
    leads.push({ rowNumber, lead });
  });

  const groupedSales = new Map<string, SaleImportRow>();
  rawSaleRows.forEach((raw, index) => {
    const rowNumber = Number(raw.__rowNumber ?? index + 2);
    const row = normalizedRow(raw);
    const clientPhone = normalizePhone(pick(row, "WhatsApp do cliente", "WhatsApp", "Telefone"));
    const clientName = cleanText(pick(row, "Nome do cliente", "Cliente", "Nome"));
    const propertyValue = parseMoney(pick(row, "Valor do imóvel", "Valor do imovel"));
    const commissionPercent = parsePercent(pick(row, "Comissão %", "Comissao %", "Percentual da comissão"));
    const explicitCommission = parseMoney(pick(row, "Comissão total prevista", "Comissao total prevista"));
    const saleDate = parseImportDate(pick(row, "Data da venda"));

    if (!clientPhone && !clientName && !propertyValue) return;
    if (clientPhone.length < 10 || clientPhone.length > 11) issues.push(issue("Vendas_Recebimentos", rowNumber, "WhatsApp", "A venda precisa do telefone do cliente para ser vinculada."));
    if (!clientName) issues.push(issue("Vendas_Recebimentos", rowNumber, "Cliente", "Informe o nome do cliente."));
    if (!propertyValue) issues.push(issue("Vendas_Recebimentos", rowNumber, "Valor do imóvel", "Informe o valor do imóvel vendido."));

    const developmentId = cleanText(pick(row, "Empreendimento"));
    const propertyId = cleanText(pick(row, "Unidade / imóvel", "Unidade", "Imóvel"));
    const groupKey = [clientPhone, saleDate, developmentId, propertyId].join("|");
    const amount = parseMoney(pick(row, "Valor previsto da parcela", "Valor da parcela"));
    const receivedAmount = parseMoney(pick(row, "Valor recebido"));
    const installment: SaleInstallmentRecord = {
      id: `import-${rowNumber}`,
      description: cleanText(pick(row, "Descrição da parcela", "Parcela")) || "Parcela importada",
      amount,
      expectedAt: parseImportDate(pick(row, "Previsão de recebimento", "Previsao de recebimento")),
      receivedAt: parseImportDate(pick(row, "Data efetiva do recebimento", "Data de recebimento")),
      receivedAmount,
      status: installmentStatusCode(pick(row, "Status da parcela")),
    };

    const existing = groupedSales.get(groupKey);
    if (existing) {
      existing.sale.installments.push(installment);
      if (!existing.sale.commissionValue && explicitCommission) existing.sale.commissionValue = explicitCommission;
      return;
    }

    groupedSales.set(groupKey, {
      rowNumber,
      clientPhone,
      brokerReference: cleanText(pick(row, "Corretor responsável", "Corretor")),
      sale: {
        leadId: "",
        clientName,
        brokerId: "",
        developmentId,
        propertyId,
        saleDate,
        propertyValue,
        commissionPercent,
        commissionValue: explicitCommission || propertyValue * commissionPercent,
        payerName: cleanText(pick(row, "Empresa pagadora", "Pagador")),
        invoiceExpectedAt: parseImportDate(pick(row, "Previsão de emissão da NF", "Previsao de emissao da NF")),
        invoiceIssuedAt: parseImportDate(pick(row, "Data de emissão da NF", "Data de emissao da NF")),
        invoiceNumber: cleanText(pick(row, "Número da NF", "Numero da NF", "Nota fiscal")),
        status: saleStatusCode(pick(row, "Status da venda")),
        notes: cleanText(pick(row, "Observações", "Notas")),
        installments: [installment],
      },
    });
  });

  return {
    leads,
    sales: [...groupedSales.values()],
    issues,
    valid: issues.length === 0 && leads.length > 0,
  };
}
