export type DevelopmentStatus = "draft" | "published" | "archived";
export type PropertyStatus = "available" | "reserved" | "sold" | "inactive";

export interface Development {
  id: string;
  slug: string;
  name: string;
  developer: string;
  city: string;
  neighborhood: string;
  state: string;
  address: string;
  category: string;
  program: string;
  shortDescription: string;
  description: string;
  priceFrom: number | null;
  bedroomsMin: number | null;
  bedroomsMax: number | null;
  bathroomsMin: number | null;
  bathroomsMax: number | null;
  parkingMin: number | null;
  parkingMax: number | null;
  areaMin: number | null;
  areaMax: number | null;
  features: string[];
  financing: string[];
  coverImage: string;
  gallery: string[];
  featured: boolean;
  status: DevelopmentStatus;
  active: boolean;
  createdAt: string | null;
  updatedAt: string | null;
}

export type DevelopmentInput = Omit<Development, "id" | "createdAt" | "updatedAt">;

export interface PropertyUnit {
  id: string;
  developmentId: string;
  code: string;
  title: string;
  type: string;
  block: string;
  unit: string;
  price: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  parkingSpaces: number | null;
  area: number | null;
  status: PropertyStatus;
  commissionPercent: number | null;
  commissionAmount: number | null;
  description: string;
  coverImage: string;
  gallery: string[];
  featured: boolean;
  active: boolean;
  createdAt: string | null;
  updatedAt: string | null;
}

export type PropertyInput = Omit<PropertyUnit, "id" | "createdAt" | "updatedAt">;

// Compatibilidade com componentes antigos.
export type Project = Development;
