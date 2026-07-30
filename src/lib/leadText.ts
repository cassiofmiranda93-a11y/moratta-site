const LOWERCASE_WORDS = new Set(["a", "as", "e", "da", "das", "de", "do", "dos", "em"]);
const UPPERCASE_WORDS = new Set(["fgts", "mcmv", "mrv", "cef", "rs", "sc", "sp", "ii", "iii", "iv"]);

const CITY_ALIASES: Record<string, string> = {
  "alvorada": "Alvorada",
  "cachoeirinha": "Cachoeirinha",
  "canoas": "Canoas",
  "esteio": "Esteio",
  "general camara": "General Câmara",
  "gravatai": "Gravataí",
  "guaiba": "Guaíba",
  "porto alegre": "Porto Alegre",
  "sao leopoldo": "São Leopoldo",
  "sapucaia do sul": "Sapucaia do Sul",
  "viamao": "Viamão",
};

const INTEREST_ALIASES: Record<string, string> = {
  "aguas claras": "Águas Claras",
  "campo belo": "Campo Belo",
  "central park": "Central Park",
  "jardim dos estados": "Jardim dos Estados",
  "lev gravatai": "LEV Gravataí",
  "mirante": "Mirante",
  "morada do vale ii": "Morada do Vale II",
  "parque italia": "Parque Itália",
  "quartiere": "Quartiere",
  "san diego": "San Diego",
};

function clean(value: unknown) {
  return String(value ?? "").trim().replace(/\s+/g, " ");
}

function key(value: unknown) {
  return clean(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function capitalizeWord(word: string) {
  if (!word) return word;
  return word.charAt(0).toLocaleUpperCase("pt-BR") + word.slice(1).toLocaleLowerCase("pt-BR");
}

export function toTitleCase(value: unknown) {
  const text = clean(value);
  if (!text) return "";

  return text
    .split(" ")
    .map((word, index) => {
      const normalized = key(word);
      if (UPPERCASE_WORDS.has(normalized)) return normalized.toUpperCase();
      if (index > 0 && LOWERCASE_WORDS.has(normalized)) return normalized;
      return word
        .split("-")
        .map((part) => capitalizeWord(part))
        .join("-");
    })
    .join(" ");
}

export function normalizePersonName(value: unknown) {
  return toTitleCase(value);
}

export function normalizeCity(value: unknown) {
  const normalized = key(value);
  return CITY_ALIASES[normalized] ?? toTitleCase(value);
}

export function normalizePropertyInterest(value: unknown) {
  const normalized = key(value);
  return INTEREST_ALIASES[normalized] ?? toTitleCase(value);
}

export function normalizeCampaign(value: unknown) {
  return toTitleCase(value);
}

export function normalizeEmail(value: unknown) {
  return clean(value).toLowerCase();
}

export function normalizeLeadPhone(value: unknown) {
  let digits = clean(value).replace(/\D/g, "");
  if (digits.startsWith("55") && digits.length > 11) digits = digits.slice(2);
  return digits;
}

export function normalizeLeadTextFields<T extends {
  name?: string;
  phone?: string;
  email?: string;
  city?: string;
  propertyInterest?: string;
  campaign?: string;
}>(input: T): T {
  return {
    ...input,
    ...(input.name !== undefined ? { name: normalizePersonName(input.name) } : {}),
    ...(input.phone !== undefined ? { phone: normalizeLeadPhone(input.phone) } : {}),
    ...(input.email !== undefined ? { email: normalizeEmail(input.email) } : {}),
    ...(input.city !== undefined ? { city: normalizeCity(input.city) } : {}),
    ...(input.propertyInterest !== undefined ? { propertyInterest: normalizePropertyInterest(input.propertyInterest) } : {}),
    ...(input.campaign !== undefined ? { campaign: normalizeCampaign(input.campaign) } : {}),
  };
}
