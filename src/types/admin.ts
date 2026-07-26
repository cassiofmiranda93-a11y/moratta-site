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
  createdAt: string | null;
  updatedAt: string | null;
}

export interface BrokerRecord {
  id: string;
  name: string;
  email: string;
  phone: string;
  creci: string;
  active: boolean;
  createdAt: string | null;
  updatedAt: string | null;
}

export type BrokerInput = Omit<BrokerRecord, "id" | "createdAt" | "updatedAt">;
