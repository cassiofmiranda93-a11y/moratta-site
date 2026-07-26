"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import DevelopmentCard from "./DevelopmentCard";
import { useCatalog } from "@/hooks/useCatalog";
import { filterDevelopments } from "@/lib/catalog";

export default function DevelopmentCatalog({ compact = false }: { compact?: boolean }) {
  const { developments, loading, error } = useCatalog({ publicOnly: true });
  const [query, setQuery] = useState("");
  const [city, setCity] = useState("");
  const [category, setCategory] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [bedrooms, setBedrooms] = useState("");

  const cities = useMemo(() => [...new Set(developments.map((item) => item.city).filter(Boolean))].sort(), [developments]);
  const categories = useMemo(() => [...new Set(developments.map((item) => item.category).filter(Boolean))].sort(), [developments]);
  const filtered = useMemo(() => {
    const base = filterDevelopments(developments, query, city, category).filter((item) => {
      const priceOk = !maxPrice || item.priceFrom === null || item.priceFrom <= Number(maxPrice);
      const bedroomsOk = !bedrooms || (item.bedroomsMax ?? item.bedroomsMin ?? 0) >= Number(bedrooms);
      return priceOk && bedroomsOk;
    });
    return base.slice(0, compact ? 3 : undefined);
  }, [developments, query, city, category, maxPrice, bedrooms, compact]);

  return (
    <div>
      {!compact && (
        <div className="mb-10 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-2 xl:grid-cols-[1fr_180px_180px_180px_160px]">
          <label className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={19} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Busque por nome, cidade ou construtora"
              className="h-12 w-full rounded-xl border border-slate-200 pl-11 pr-4 outline-none transition focus:border-blue-700"
            />
          </label>
          <select value={city} onChange={(event) => setCity(event.target.value)} className="h-12 rounded-xl border border-slate-200 px-4 outline-none focus:border-blue-700">
            <option value="">Todas as cidades</option>
            {cities.map((item) => <option key={item}>{item}</option>)}
          </select>
          <select value={category} onChange={(event) => setCategory(event.target.value)} className="h-12 rounded-xl border border-slate-200 px-4 outline-none focus:border-blue-700">
            <option value="">Todos os tipos</option>
            {categories.map((item) => <option key={item}>{item}</option>)}
          </select>
          <select value={maxPrice} onChange={(event) => setMaxPrice(event.target.value)} className="h-12 rounded-xl border border-slate-200 px-4 outline-none focus:border-blue-700"><option value="">Qualquer preço</option><option value="250000">Até R$ 250 mil</option><option value="350000">Até R$ 350 mil</option><option value="500000">Até R$ 500 mil</option><option value="1000000">Até R$ 1 milhão</option></select>
          <select value={bedrooms} onChange={(event) => setBedrooms(event.target.value)} className="h-12 rounded-xl border border-slate-200 px-4 outline-none focus:border-blue-700"><option value="">Dormitórios</option><option value="2">2 ou mais</option><option value="3">3 ou mais</option><option value="4">4 ou mais</option></select>
        </div>
      )}

      {error && <p className="mb-6 rounded-xl bg-amber-50 p-4 text-sm text-amber-800">Catálogo local exibido. Firebase: {error}</p>}
      {loading && <p className="py-10 text-center text-slate-500">Carregando empreendimentos...</p>}
      {!loading && filtered.length === 0 && <p className="rounded-2xl bg-slate-50 py-14 text-center text-slate-500">Nenhum empreendimento encontrado.</p>}
      <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((development) => <DevelopmentCard key={development.id} development={development} />)}
      </div>
    </div>
  );
}
