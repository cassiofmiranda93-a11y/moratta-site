import type { Development, DevelopmentInput, PropertyUnit } from "@/types/project";

export function createSlug(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function normalizePhone(value: string) {
  return value.replace(/\D/g, "").replace(/^0+/, "");
}

export function parseList(value: string) {
  return [...new Set(value.split(/[,\n]/).map((item) => item.trim()).filter(Boolean))];
}

export function formatCurrency(value: number | null | undefined) {
  if (typeof value !== "number" || Number.isNaN(value)) return "Consulte";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(value);
}

export function toNullableNumber(value: string | number | null | undefined) {
  if (value === "" || value === null || value === undefined) return null;
  const parsed = typeof value === "number" ? value : Number(String(value).replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

export function sanitizeDevelopmentInput(input: DevelopmentInput): DevelopmentInput {
  return {
    ...input,
    name: input.name.trim(),
    slug: createSlug(input.slug || input.name),
    developer: input.developer.trim(),
    city: input.city.trim(),
    neighborhood: input.neighborhood.trim(),
    state: input.state.trim().toUpperCase() || "RS",
    address: input.address.trim(),
    category: input.category.trim(),
    program: input.program.trim(),
    shortDescription: input.shortDescription.trim(),
    description: input.description.trim(),
    features: [...new Set(input.features.map((item) => item.trim()).filter(Boolean))],
    financing: [...new Set(input.financing.map((item) => item.trim()).filter(Boolean))],
    gallery: [...new Set(input.gallery.filter(Boolean))],
    active: input.status === "published" ? true : input.active,
  };
}

export function filterDevelopments(
  developments: Development[],
  query: string,
  city: string,
  category: string,
) {
  const normalizedQuery = query.trim().toLocaleLowerCase("pt-BR");
  return developments.filter((development) => {
    const haystack = [
      development.name,
      development.developer,
      development.city,
      development.neighborhood,
      development.category,
      development.program,
    ]
      .join(" ")
      .toLocaleLowerCase("pt-BR");
    return (
      (!normalizedQuery || haystack.includes(normalizedQuery)) &&
      (!city || development.city === city) &&
      (!category || development.category === category)
    );
  });
}

export function availableUnits(properties: PropertyUnit[], developmentId: string) {
  return properties.filter(
    (property) =>
      property.developmentId === developmentId &&
      property.active &&
      property.status === "available",
  );
}
