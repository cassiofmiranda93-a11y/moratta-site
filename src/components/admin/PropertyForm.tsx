"use client";

import { FormEvent, useState } from "react";
import { Loader2, Save, X } from "lucide-react";
import { toNullableNumber } from "@/lib/catalog";
import { saveProperty, uploadCatalogImages } from "@/services/catalogService";
import type { Development, PropertyInput, PropertyStatus, PropertyUnit } from "@/types/project";

function initialValue(developmentId: string, item?: PropertyUnit): PropertyInput {
  return item ? {
    developmentId: item.developmentId, code: item.code, title: item.title, type: item.type,
    block: item.block, unit: item.unit, price: item.price, bedrooms: item.bedrooms,
    bathrooms: item.bathrooms, parkingSpaces: item.parkingSpaces, area: item.area,
    status: item.status, commissionPercent: item.commissionPercent,
    commissionAmount: item.commissionAmount, description: item.description,
    coverImage: item.coverImage, gallery: item.gallery, featured: item.featured, active: item.active,
  } : {
    developmentId, code: "", title: "", type: "Casa", block: "", unit: "",
    price: null, bedrooms: 2, bathrooms: 1, parkingSpaces: 1, area: null,
    status: "available", commissionPercent: null, commissionAmount: null,
    description: "", coverImage: "", gallery: [], featured: false, active: true,
  };
}

export default function PropertyForm({ developments, item, onClose, onSaved }: {
  developments: Development[];
  item?: PropertyUnit;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [value, setValue] = useState(() => initialValue(developments[0]?.id ?? "", item));
  const [files, setFiles] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  function update<K extends keyof PropertyInput>(key: K, next: PropertyInput[K]) { setValue((current) => ({ ...current, [key]: next })); }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault(); setSaving(true); setError("");
    try {
      const uploaded = files.length ? await uploadCatalogImages(files, `units/${value.developmentId}`) : [];
      const gallery = [...new Set([...value.gallery, ...uploaded])];
      await saveProperty({ ...value, coverImage: value.coverImage || gallery[0] || "", gallery }, item?.id);
      onSaved();
    } catch (nextError) { setError(nextError instanceof Error ? nextError.message : "Não foi possível salvar."); }
    finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto bg-slate-950/60 p-4 backdrop-blur-sm">
      <form onSubmit={handleSubmit} className="mx-auto my-6 max-w-3xl rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5"><div><p className="text-sm font-semibold text-blue-800">UNIDADE / IMÓVEL</p><h2 className="text-2xl font-extrabold text-slate-900">{item ? "Editar imóvel" : "Novo imóvel"}</h2></div><button type="button" onClick={onClose} className="rounded-xl p-2 hover:bg-slate-100"><X /></button></div>
        <div className="grid gap-4 p-6 md:grid-cols-2">
          <Field label="Empreendimento"><select required value={value.developmentId} onChange={(event) => update("developmentId", event.target.value)}><option value="">Selecione</option>{developments.map((development) => <option value={development.id} key={development.id}>{development.name}</option>)}</select></Field>
          <Field label="Título"><input required value={value.title} onChange={(event) => update("title", event.target.value)} placeholder="Casa 14" /></Field>
          <Field label="Código"><input value={value.code} onChange={(event) => update("code", event.target.value)} placeholder="CB-C14" /></Field>
          <Field label="Tipo"><select value={value.type} onChange={(event) => update("type", event.target.value)}><option>Casa</option><option>Apartamento</option><option>Lote</option><option>Sala comercial</option><option>Imóvel usado</option></select></Field>
          <Field label="Bloco / quadra"><input value={value.block} onChange={(event) => update("block", event.target.value)} /></Field>
          <Field label="Unidade"><input value={value.unit} onChange={(event) => update("unit", event.target.value)} /></Field>
          <NumberField label="Preço" value={value.price} onChange={(next) => update("price", next)} />
          <NumberField label="Área (m²)" value={value.area} onChange={(next) => update("area", next)} />
          <NumberField label="Dormitórios" value={value.bedrooms} onChange={(next) => update("bedrooms", next)} />
          <NumberField label="Banheiros" value={value.bathrooms} onChange={(next) => update("bathrooms", next)} />
          <NumberField label="Vagas" value={value.parkingSpaces} onChange={(next) => update("parkingSpaces", next)} />
          <Field label="Disponibilidade"><select value={value.status} onChange={(event) => update("status", event.target.value as PropertyStatus)}><option value="available">Disponível</option><option value="reserved">Reservado</option><option value="sold">Vendido</option><option value="inactive">Inativo</option></select></Field>
          <NumberField label="Comissão (%)" value={value.commissionPercent} onChange={(next) => update("commissionPercent", next)} />
          <NumberField label="Comissão (R$)" value={value.commissionAmount} onChange={(next) => update("commissionAmount", next)} />
          <div className="md:col-span-2"><Field label="Descrição"><textarea rows={4} value={value.description} onChange={(event) => update("description", event.target.value)} /></Field></div>
          <div className="md:col-span-2"><Field label="Fotos"><input type="file" accept="image/*" multiple onChange={(event) => setFiles(Array.from(event.target.files ?? []))} /></Field></div>
          <label className="flex items-center gap-3"><input type="checkbox" className="h-5 w-5" checked={value.featured} onChange={(event) => update("featured", event.target.checked)} /> Destaque</label>
          <label className="flex items-center gap-3"><input type="checkbox" className="h-5 w-5" checked={value.active} onChange={(event) => update("active", event.target.checked)} /> Ativo</label>
          {error && <p className="md:col-span-2 rounded-xl bg-red-50 p-4 text-red-700">{error}</p>}
        </div>
        <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-5"><button type="button" onClick={onClose} className="rounded-xl border border-slate-300 px-5 py-3 font-bold">Cancelar</button><button disabled={saving} className="flex items-center gap-2 rounded-xl bg-blue-950 px-6 py-3 font-bold text-white disabled:opacity-60">{saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />} Salvar imóvel</button></div>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label><span className="mb-1.5 block text-sm font-semibold text-slate-700">{label}</span><div className="[&_input]:h-12 [&_input]:w-full [&_input]:rounded-xl [&_input]:border [&_input]:border-slate-200 [&_input]:px-4 [&_select]:h-12 [&_select]:w-full [&_select]:rounded-xl [&_select]:border [&_select]:border-slate-200 [&_select]:px-4 [&_textarea]:w-full [&_textarea]:rounded-xl [&_textarea]:border [&_textarea]:border-slate-200 [&_textarea]:p-4">{children}</div></label>; }
function NumberField({ label, value, onChange }: { label: string; value: number | null; onChange: (value: number | null) => void }) { return <Field label={label}><input type="number" min="0" step="0.01" value={value ?? ""} onChange={(event) => onChange(toNullableNumber(event.target.value))} /></Field>; }
