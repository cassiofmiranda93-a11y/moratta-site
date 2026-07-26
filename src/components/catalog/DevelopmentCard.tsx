import Link from "next/link";
import { BedDouble, MapPin, Maximize2, ArrowRight } from "lucide-react";
import CatalogImage from "./CatalogImage";
import { formatCurrency } from "@/lib/catalog";
import type { Development } from "@/types/project";

export default function DevelopmentCard({ development }: { development: Development }) {
  return (
    <article className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
      <div className="relative h-64 overflow-hidden bg-slate-100">
        <CatalogImage
          src={development.coverImage}
          alt={development.name}
          className="object-cover transition duration-500 group-hover:scale-105"
        />
        {development.program && (
          <span className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1.5 text-xs font-bold text-blue-900 shadow">
            {development.program}
          </span>
        )}
      </div>

      <div className="p-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-[#B68726]">
          {development.category || "Empreendimento"}
        </p>
        <h2 className="mt-2 text-2xl font-extrabold text-slate-900">{development.name}</h2>
        <div className="mt-3 flex items-center gap-2 text-sm text-slate-500">
          <MapPin size={16} />
          {development.neighborhood ? `${development.neighborhood}, ` : ""}
          {development.city} - {development.state}
        </div>
        <p className="mt-5 line-clamp-3 leading-7 text-slate-600">
          {development.shortDescription || development.description}
        </p>

        <div className="mt-5 flex flex-wrap gap-4 text-sm text-slate-600">
          {development.bedroomsMin !== null && (
            <span className="flex items-center gap-1.5"><BedDouble size={17} /> {development.bedroomsMin} dorm.</span>
          )}
          {development.areaMin !== null && (
            <span className="flex items-center gap-1.5"><Maximize2 size={17} /> a partir de {development.areaMin} m²</span>
          )}
        </div>

        <div className="mt-7 flex items-end justify-between gap-4 border-t border-slate-100 pt-5">
          <div>
            <p className="text-xs text-slate-500">A partir de</p>
            <p className="text-xl font-extrabold text-blue-950">{formatCurrency(development.priceFrom)}</p>
          </div>
          <Link
            href={`/empreendimentos/${development.slug}`}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-950 px-4 py-3 font-semibold text-white transition hover:bg-blue-800"
          >
            Ver detalhes <ArrowRight size={17} />
          </Link>
        </div>
      </div>
    </article>
  );
}
