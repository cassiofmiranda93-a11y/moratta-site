import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
  type DocumentData,
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { firestore, firebaseConfigurationError, storage } from "@/config/firebase";
import { COMPANY } from "@/constants/company";
import { sanitizeDevelopmentInput } from "@/lib/catalog";
import type {
  Development,
  DevelopmentInput,
  PropertyInput,
  PropertyUnit,
} from "@/types/project";

const organizationPath = ["organizations", COMPANY.organizationId] as const;

function requireFirestore() {
  if (!firestore) throw new Error(firebaseConfigurationError ?? "Firestore indisponível.");
  return firestore;
}

function requireStorage() {
  if (!storage) throw new Error(firebaseConfigurationError ?? "Firebase Storage indisponível.");
  return storage;
}

function toIsoString(value: unknown) {
  if (value instanceof Date) return value.toISOString();
  if (value && typeof value === "object" && "toDate" in value && typeof value.toDate === "function") {
    return value.toDate().toISOString();
  }
  return typeof value === "string" ? value : null;
}

function toNumberOrNull(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function toStringArray(value: unknown) {
  return Array.isArray(value) ? value.map(String).filter(Boolean) : [];
}

function toDevelopment(data: DocumentData, fallbackId: string): Development {
  return {
    id: fallbackId,
    slug: String(data.slug ?? fallbackId),
    name: String(data.name ?? ""),
    developer: String(data.developer ?? ""),
    city: String(data.city ?? ""),
    neighborhood: String(data.neighborhood ?? ""),
    state: String(data.state ?? "RS"),
    address: String(data.address ?? ""),
    category: String(data.category ?? ""),
    program: String(data.program ?? ""),
    shortDescription: String(data.shortDescription ?? ""),
    description: String(data.description ?? ""),
    priceFrom: toNumberOrNull(data.priceFrom),
    bedroomsMin: toNumberOrNull(data.bedroomsMin),
    bedroomsMax: toNumberOrNull(data.bedroomsMax),
    bathroomsMin: toNumberOrNull(data.bathroomsMin),
    bathroomsMax: toNumberOrNull(data.bathroomsMax),
    parkingMin: toNumberOrNull(data.parkingMin),
    parkingMax: toNumberOrNull(data.parkingMax),
    areaMin: toNumberOrNull(data.areaMin),
    areaMax: toNumberOrNull(data.areaMax),
    features: toStringArray(data.features),
    financing: toStringArray(data.financing),
    coverImage: String(data.coverImage ?? ""),
    gallery: toStringArray(data.gallery),
    featured: Boolean(data.featured),
    status: data.status === "published" || data.status === "archived" ? data.status : "draft",
    active: data.active !== false,
    createdAt: toIsoString(data.createdAt),
    updatedAt: toIsoString(data.updatedAt),
  };
}

function toProperty(data: DocumentData, fallbackId: string): PropertyUnit {
  const allowedStatus = ["available", "reserved", "sold", "inactive"];
  return {
    id: fallbackId,
    developmentId: String(data.developmentId ?? ""),
    code: String(data.code ?? ""),
    title: String(data.title ?? ""),
    type: String(data.type ?? ""),
    block: String(data.block ?? ""),
    unit: String(data.unit ?? ""),
    price: toNumberOrNull(data.price),
    bedrooms: toNumberOrNull(data.bedrooms),
    bathrooms: toNumberOrNull(data.bathrooms),
    parkingSpaces: toNumberOrNull(data.parkingSpaces),
    area: toNumberOrNull(data.area),
    status: allowedStatus.includes(String(data.status))
      ? (data.status as PropertyUnit["status"])
      : "available",
    commissionPercent: toNumberOrNull(data.commissionPercent),
    commissionAmount: toNumberOrNull(data.commissionAmount),
    description: String(data.description ?? ""),
    coverImage: String(data.coverImage ?? ""),
    gallery: toStringArray(data.gallery),
    featured: Boolean(data.featured),
    active: data.active !== false,
    createdAt: toIsoString(data.createdAt),
    updatedAt: toIsoString(data.updatedAt),
  };
}

function developmentCollection() {
  return collection(requireFirestore(), ...organizationPath, "developments");
}

function propertyCollection() {
  return collection(requireFirestore(), ...organizationPath, "properties");
}

export function subscribeToDevelopments(
  callback: (items: Development[]) => void,
  onError: (error: Error) => void,
  options: { publicOnly?: boolean } = {},
) {
  if (!firestore) {
    callback([]);
    return () => undefined;
  }
  return onSnapshot(
    developmentCollection(),
    (snapshot) => {
      const items = snapshot.docs
        .map((item) => toDevelopment(item.data(), item.id))
        .filter((item) => !options.publicOnly || (item.active && item.status === "published"))
        .sort((left, right) => Number(right.featured) - Number(left.featured) || left.name.localeCompare(right.name));
      callback(items);
    },
    (error) => onError(error),
  );
}

export function subscribeToProperties(
  callback: (items: PropertyUnit[]) => void,
  onError: (error: Error) => void,
  options: { publicOnly?: boolean } = {},
) {
  if (!firestore) {
    callback([]);
    return () => undefined;
  }
  return onSnapshot(
    propertyCollection(),
    (snapshot) => {
      const items = snapshot.docs
        .map((item) => toProperty(item.data(), item.id))
        .filter((item) => !options.publicOnly || item.active)
        .sort((left, right) => left.title.localeCompare(right.title));
      callback(items);
    },
    (error) => onError(error),
  );
}

export async function saveDevelopment(input: DevelopmentInput, id?: string) {
  const database = requireFirestore();
  const cleanInput = sanitizeDevelopmentInput(input);
  if (id) {
    await updateDoc(doc(database, ...organizationPath, "developments", id), {
      ...cleanInput,
      updatedAt: serverTimestamp(),
    });
    return id;
  }
  const created = await addDoc(developmentCollection(), {
    ...cleanInput,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return created.id;
}

export async function saveProperty(input: PropertyInput, id?: string) {
  const database = requireFirestore();
  const payload = {
    ...input,
    code: input.code.trim(),
    title: input.title.trim(),
    type: input.type.trim(),
    block: input.block.trim(),
    unit: input.unit.trim(),
    description: input.description.trim(),
    gallery: [...new Set(input.gallery.filter(Boolean))],
    updatedAt: serverTimestamp(),
  };
  if (id) {
    await updateDoc(doc(database, ...organizationPath, "properties", id), payload);
    return id;
  }
  const created = await addDoc(propertyCollection(), {
    ...payload,
    createdAt: serverTimestamp(),
  });
  return created.id;
}

export async function archiveDevelopment(id: string) {
  await updateDoc(doc(requireFirestore(), ...organizationPath, "developments", id), {
    status: "archived",
    active: false,
    updatedAt: serverTimestamp(),
  });
}

export async function archiveProperty(id: string) {
  await updateDoc(doc(requireFirestore(), ...organizationPath, "properties", id), {
    status: "inactive",
    active: false,
    updatedAt: serverTimestamp(),
  });
}

export async function uploadCatalogImages(files: File[], folder: string) {
  const bucket = requireStorage();
  const urls: string[] = [];
  for (const file of files) {
    const safeName = `${Date.now()}-${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "-")}`;
    const imageRef = ref(bucket, `organizations/${COMPANY.organizationId}/catalog/${folder}/${safeName}`);
    await uploadBytes(imageRef, file, { contentType: file.type });
    urls.push(await getDownloadURL(imageRef));
  }
  return urls;
}

export async function seedDevelopments(items: Development[]) {
  const database = requireFirestore();
  const batch = writeBatch(database);
  items.forEach((item) => {
    const target = doc(database, ...organizationPath, "developments", item.id);
    const { id: _id, createdAt: _createdAt, updatedAt: _updatedAt, ...payload } = item;
    batch.set(target, {
      ...payload,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }, { merge: true });
  });
  await batch.commit();
}

export async function setOrganizationSettings(data: Record<string, unknown>) {
  await setDoc(
    doc(requireFirestore(), ...organizationPath, "settings", "site"),
    { ...data, updatedAt: serverTimestamp() },
    { merge: true },
  );
}
