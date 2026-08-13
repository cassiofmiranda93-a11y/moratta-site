export interface WebsiteLeadRecord {
  id: string;
  name: string;
  phone: string;
  email: string;
  city: string;
  propertyInterest: string;
  developmentId: string;
  propertyId: string;
  assignedTo: string;
  stage: string;
  source: string;
  campaign: string;
  utmSource: string;
  income: number;
  fgts: number;
  notes: string;
  nextContactAt: string | null;
  lastContactAt: string | null;
  importedAt?: string | null;
  lostAt?: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface LeadActivityRecord {
  id: string;
  type: "note" | "call" | "whatsapp" | "visit" | "document" | "stage" | "task";
  title: string;
  description: string;
  dueAt: string | null;
  completed: boolean;
  createdAt: string | null;
}

export interface BrokerRecord {
  id: string;
  name: string;
  email: string;
  phone: string;
  creci: string;
  active: boolean;
  available: boolean;
  specialties: string[];
  cities: string[];
  dailyLeadLimit: number;
  monthlyGoal: number;
  commissionRate: number;
  role: UserRole;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface DistributionSettings {
  mode: "round_robin" | "balanced";
  respectAvailability: boolean;
  respectDailyLimit: boolean;
  useCityMatching: boolean;
  useSpecialtyMatching: boolean;
}

export interface IntegrationSettings {
  metaEnabled: boolean;
  metaPageId: string;
  metaFormIds: string[];
  autoDistributeMetaLeads: boolean;
  whatsappEnabled: boolean;
  whatsappNumber: string;
  whatsappDefaultMessage: string;
  webhookUrl: string;
}

export type AtlasPriority = "critical" | "high" | "medium" | "low";

export interface AtlasLeadAssessment {
  score: number;
  probability: number;
  priority: AtlasPriority;
  inactivityDays: number;
  reasons: string[];
  alerts: string[];
  nextAction: string;
  recommendedDevelopment: string;
  suggestedWhatsapp: string;
  suggestedCallScript: string;
}

export type SaleStatus =
  | "confirmed"
  | "awaiting_documents"
  | "awaiting_invoice"
  | "invoice_issued"
  | "payment_scheduled"
  | "partially_received"
  | "received"
  | "overdue"
  | "cancelled";

export type SaleInstallmentStatus = "pending" | "scheduled" | "partial" | "received" | "overdue" | "cancelled";

export interface SaleInstallmentRecord {
  id: string;
  description: string;
  amount: number;
  expectedAt: string;
  receivedAt: string;
  receivedAmount: number;
  status: SaleInstallmentStatus;
}

export interface SaleRecord {
  id: string;
  leadId: string;
  clientName: string;
  brokerId: string;
  developmentId: string;
  propertyId: string;
  saleDate: string;
  propertyValue: number;
  commissionPercent: number;
  commissionValue: number;
  payerName: string;
  invoiceExpectedAt: string;
  invoiceIssuedAt: string;
  invoiceNumber: string;
  status: SaleStatus;
  notes: string;
  installments: SaleInstallmentRecord[];
  createdAt: string | null;
  updatedAt: string | null;
}

export type BrokerInput = Omit<BrokerRecord, "id" | "createdAt" | "updatedAt">;
export type SaleInput = Omit<SaleRecord, "id" | "createdAt" | "updatedAt">;

export type UserRole = "admin" | "manager" | "broker" | "finance";

export type WebsiteLeadInput = Omit<
  WebsiteLeadRecord,
  "id" | "createdAt" | "updatedAt"
> & {
  importedCreatedAt?: string | null;
};

export interface LeadImportRow {
  rowNumber: number;
  lead: WebsiteLeadInput;
}

export interface SaleImportRow {
  rowNumber: number;
  clientPhone: string;
  brokerReference: string;
  sale: SaleInput;
}

export interface CrmImportIssue {
  sheet: "Clientes" | "Vendas_Recebimentos";
  row: number;
  field: string;
  message: string;
}

export interface CrmImportPreview {
  leads: LeadImportRow[];
  sales: SaleImportRow[];
  issues: CrmImportIssue[];
  valid: boolean;
}

export interface CrmImportResult {
  leadsCreated: number;
  leadsSkipped: number;
  salesCreated: number;
  salesSkipped: number;
}

export interface SecuritySettings {
  strictAccess: boolean;
  auditRetentionDays: number;
  requireRegisteredMember: boolean;
}

export interface OrganizationAccessRecord {
  id: string;
  email: string;
  memberId: string;
  role: UserRole;
  active: boolean;
  createdAt: string | null;
  updatedAt: string | null;
}

export type AuditEntityType = "lead" | "sale" | "member" | "settings" | "integration" | "catalog" | "backup";

export interface AuditLogRecord {
  id: string;
  action: string;
  entityType: AuditEntityType;
  entityId: string;
  entityLabel: string;
  actorUid: string;
  actorEmail: string;
  details: Record<string, unknown>;
  createdAt: string | null;
}

export type CrmAlertSeverity = "critical" | "warning" | "info";
export type CrmAlertType = "lead_return" | "lead_inactive" | "invoice_due" | "payment_due" | "payment_overdue";

export interface CrmAlert {
  id: string;
  type: CrmAlertType;
  severity: CrmAlertSeverity;
  title: string;
  description: string;
  entityType: "lead" | "sale";
  entityId: string;
  brokerId: string;
  dueAt: string;
}

export interface IntegrationRuntimeStatus {
  firebaseAdminConfigured: boolean;
  metaConfigured: boolean;
  whatsappConfigured: boolean;
  metaWebhookPath: string;
  whatsappWebhookPath: string;
}

export interface CrmBackupData {
  schemaVersion: 1;
  generatedAt: string;
  organizationId: string;
  leads: WebsiteLeadRecord[];
  brokers: BrokerRecord[];
  sales: SaleRecord[];
  settings: {
    distribution: DistributionSettings;
    integrations: IntegrationSettings;
    security: SecuritySettings;
  };
}
