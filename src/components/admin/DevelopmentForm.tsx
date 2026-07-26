"use client";

import { FormEvent, useState } from "react";
import { ImagePlus, Loader2, Save, X } from "lucide-react";
import { createSlug, parseList, toNullableNumber } from "@/lib/catalog";
import { saveDevelopment, uploadCatalogImages } from "@/services/catalogService";
import type { Development, DevelopmentInput, DevelopmentStatus } from "@/types/project";

function initialValue(item?: Development): DevelopmentInput {
  return item ? {
    slug: item.slug,
    name: item.name,
    developer: item.developer,
    city: item.city,
    neighborhood: item.neighborhood,
    state: item.state,
    address: item.address,
    category: item.category,
    program: item.program,
    shortDescription: item.shortDescription,
    description: item.description,
    priceFrom: item.priceFrom,
    bedroomsMin: item.bedroomsMin,
    bedroomsMax: item.bedroomsMax,
    bathroomsMin: item.bathroomsMin,
    bathroomsMax: item.bathroomsMax,
    parkingMin: item.parkingMin,
    parkingMax: item.parkingMax,
    areaMin: item.areaMin,
    areaMax: item.areaMax,
    features: item.features,
    financing: item.financing,
    coverImage: item.coverImage,
    gallery: item.gallery,
    featured: item.featured,
    status: item.status,
    active: item.active,
  } : {
    slug: "",
    name: "",
    developer: "",
    city: "Gravataí",
    neighborhood: "",
    state: "RS",
    address: "",
    category: "Casas",
    program: "Minha Casa Minha Vida",
    shortDescription: "",
    description: "",
    priceFrom: null,
    bedroomsMin: 2,
    bedroomsMax: 2,
    bathroomsMin: 1,
    bathroomsMax: 1,
    parkingMin: 1,
    parkingMax: 1,
    areaMin: null,
    areaMax: null,
    features: [],
    financing: ["Caixa", "FGTS", "Minha Casa Minha Vida"],
    coverImage: "",
    gallery: [],
    featured: false,
    status: "draft",
    active: true,
  };
}

export default function DevelopmentForm({ item, onClose, onSaved }: {
  item?: Development;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [value, setValue] = useState(() => initialValue(item));
  const [featureText, setFeatureText] = useState(value.features.join("\n"));
  const [financingText, setFinancingText] = useState(value.financing.join("\n"));
  const [files, setFiles] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function update<K extends keyof DevelopmentInput>(key: K, next: DevelopmentInput[K]) {
    setValue((current) => ({ ...current, [key]: next }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const uploaded = files.length ? await uploadCatalogImages(files, createSlug(value.slug || value.name)) : [];
      const gallery = [...new Set([...value.gallery, ...uploaded])];
      await saveDevelopment({
        ...value,
        slug: createSlug(value.slug || value.name),
        features: parseList(featureText),
        financing: parseList(financingText),
        coverImage: value.coverImage || gallery[0] || "",
        gallery,
      }, item?.id);
      onSaved();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Não foi possível salvar.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto bg-slate-950/60 p-4 backdrop-blur-sm">
      <form onSubmit={handleSubmit} className="mx-auto my-4 max-w-5xl rounded-3xl bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between rounded-t-3xl border-b border-slate-200 bg-white px-6 py-5">
          <div><p className="text-sm font-semibold text-blue-800">CATÁLOGO</p><h2 className="text-2xl font-extrabold text-slate-900">{item ? "Editar empreendimento" : "Novo empreendimento"}</h2></div>
          <button type="button" onClick={onClose} className="rounded-xl p-2 hover:bg-slate-100"><X /></button>
        </div>

        <div className="space-y-8 p-6 md:p-8">
          <section>
            <h3 className="mb-4 font-extrabold text-slate-900">Identificação</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Nome"><input required value={value.name} onChange={(event) => update("name", event.target.value)} /></Field>
              <Field label="Slug da página"><input value={value.slug} onChange={(event) => update("slug", event.target.value)} placeholder={createSlug(value.name) || "nome-do-empreendimento"} /></Field>
              <Field label="Construtora"><input value={value.developer} onChange={(event) => update("developer", event.target.value)} /></Field>
              <Field label="Tipo"><select value={value.category} onChange={(event) => update("category", event.target.value)}><option>Casas</option><option>Apartamentos</option><option>Lotes</option><option>Imóvel usado</option><option>Comercial</option></select></Field>
              <Field label="Programa"><input value={value.program} onChange={(event) => update("program", event.target.value)} /></Field>
              <Field label="Preço inicial"><input type="number" min="0" value={value.priceFrom ?? ""} onChange={(event) => update("priceFrom", toNullableNumber(event.target.value))} /></Field>
            </div>
          </section>

          <section>
            <h3 className="mb-4 font-extrabold text-slate-900">Localização</h3>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Field label="Cidade"><input required value={value.city} onChange={(event) => update("city", event.target.value)} /></Field>
              <Field label="Bairro"><input value={value.neighborhood} onChange={(event) => update("neighborhood", event.target.value)} /></Field>
              <Field label="Estado"><input value={value.state} maxLength={2} onChange={(event) => update("state", event.target.value)} /></Field>
              <Field label="Endereço"><input value={value.address} onChange={(event) => update("address", event.target.value)} /></Field>
            </div>
          </section>

          <section>
            <h3 className="mb-4 font-extrabold text-slate-900">Características</h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <NumberField label="Dorm. mín." value={value.bedroomsMin} onChange={(next) => update("bedroomsMin", next)} />
              <NumberField label="Dorm. máx." value={value.bedroomsMax} onChange={(next) => update("bedroomsMax", next)} />
              <NumberField label="Banheiros mín." value={value.bathroomsMin} onChange={(next) => update("bathroomsMin", next)} />
              <NumberField label="Banheiros máx." value={value.bathroomsMax} onChange={(next) => update("bathroomsMax", next)} />
              <NumberField label="Vagas mín." value={value.parkingMin} onChange={(next) => update("parkingMin", next)} />
              <NumberField label="Vagas máx." value={value.parkingMax} onChange={(next) => update("parkingMax", next)} />
              <NumberField label="Área mín. (m²)" value={value.areaMin} onChange={(next) => update("areaMin", next)} />
              <NumberField label="Área máx. (m²)" value={value.areaMax} onChange={(next) => update("areaMax", next)} />
            </div>
          </section>

          <section>
            <h3 className="mb-4 font-extrabold text-slate-900">Conteúdo da página</h3>
            <div className="space-y-4">
              <Field label="Resumo"><textarea required rows={2} value={value.shortDescription} onChange={(event) => update("shortDescription", event.target.value)} /></Field>
              <Field label="Descrição completa"><textarea required rows={5} value={value.description} onChange={(event) => update("description", event.target.value)} /></Field>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Diferenciais — um por linha"><textarea rows={5} value={featureText} onChange={(event) => setFeatureText(event.target.value)} /></Field>
                <Field label="Financiamento — um por linha"><textarea rows={5} value={financingText} onChange={(event) => setFinancingText(event.target.value)} /></Field>
              </div>
            </div>
          </section>

          <section>
            <h3 className="mb-4 font-extrabold text-slate-900">Fotos</h3>
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 p-8 text-center transition hover:border-blue-700 hover:bg-blue-50">
              <ImagePlus className="text-blue-800" size={34} />
              <span className="mt-3 font-bold text-slate-800">Selecionar fotos</span>
              <span className="mt-1 text-sm text-slate-500">A primeira foto será usada como capa quando não houver capa definida.</span>
              <input type="file" accept="image/*" multiple className="hidden" onChange={(event) => setFiles(Array.from(event.target.files ?? []))} />
            </label>
            {(files.length > 0 || value.gallery.length > 0) && <p className="mt-3 text-sm text-slate-500">{files.length} nova(s) foto(s) · {value.gallery.length} foto(s) já salvas</p>}
          </section>

          <section className="grid gap-4 rounded-2xl bg-slate-50 p-5 md:grid-cols-3">
            <Field label="Status"><select value={value.status} onChange={(event) => update("status", event.target.value as DevelopmentStatus)}><option value="draft">Rascunho</option><option value="published">Publicado</option><option value="archived">Arquivado</option></select></Field>
            <label className="flex items-center gap-3 pt-7"><input type="checkbox" checked={value.featured} onChange={(event) => update("featured", event.target.checked)} className="h-5 w-5" /> <span className="font-semibold">Destaque na página inicial</span></label>
            <label className="flex items-center gap-3 pt-7"><input type="checkbox" checked={value.active} onChange={(event) => update("active", event.target.checked)} className="h-5 w-5" /> <span className="font-semibold">Cadastro ativo</span></label>
          </section>

          {error && <p className="rounded-xl bg-red-50 p-4 text-red-700">{error}</p>}
        </div>

        <div className="sticky bottom-0 flex justify-end gap-3 rounded-b-3xl border-t border-slate-200 bg-white px-6 py-5">
          <button type="button" onClick={onClose} className="rounded-xl border border-slate-300 px-5 py-3 font-bold text-slate-700">Cancelar</button>
          <button disabled={saving} className="flex items-center gap-2 rounded-xl bg-blue-950 px-6 py-3 font-bold text-white disabled:opacity-60">{saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />} Salvar empreendimento</button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-1.5 block text-sm font-semibold text-slate-700">{label}</span><div className="[&_input]:h-12 [&_input]:w-full [&_input]:rounded-xl [&_input]:border [&_input]:border-slate-200 [&_input]:px-4 [&_input]:outline-none [&_select]:h-12 [&_select]:w-full [&_select]:rounded-xl [&_select]:border [&_select]:border-slate-200 [&_select]:px-4 [&_textarea]:w-full [&_textarea]:rounded-xl [&_textarea]:border [&_textarea]:border-slate-200 [&_textarea]:p-4 [&_textarea]:outline-none">{children}</div></label>;
}

function NumberField({ label, value, onChange }: { label: string; value: number | null; onChange: (value: number | null) => void }) {
  return <Field label={label}><input type="number" min="0" step="0.01" value={value ?? ""} onChange={(event) => onChange(toNullableNumber(event.target.value))} /></Field>;
}
