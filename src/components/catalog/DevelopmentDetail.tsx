"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, Bath, BedDouble, Car, CheckCircle2, MapPin, Maximize2 } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import WhatsAppFloat from "@/components/layout/WhatsAppFloat";
import CatalogImage from "./CatalogImage";
import InterestForm from "./InterestForm";
import { Container } from "@/components/ui";
import { useCatalog } from "@/hooks/useCatalog";
import { availableUnits, formatCurrency } from "@/lib/catalog";

export default function DevelopmentDetail({ slug }: { slug: string }) {
  const { developments, properties, loading } = useCatalog({ publicOnly: true });
  const development = developments.find((item) => item.slug === slug);
  const units = useMemo(() => development ? availableUnits(properties, development.id) : [], [properties, development]);

  if (loading && !development) return <main className="grid min-h-screen place-items-center">Carregando...</main>;
  if (!development) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-50 px-6 text-center">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">Empreendimento não encontrado</h1>
          <Link href="/empreendimentos" className="mt-6 inline-block rounded-xl bg-blue-950 px-5 py-3 font-bold text-white">Voltar ao catálogo</Link>
        </div>
      </main>
    );
  }

  const gallery = [...new Set([development.coverImage, ...development.gallery].filter(Boolean))];

  return (
    <>
      <Navbar />
      <main className="bg-slate-50">
        <section className="bg-white py-6">
          <Container>
            <Link href="/empreendimentos" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-blue-800"><ArrowLeft size={17} /> Voltar aos empreendimentos</Link>
          </Container>
        </section>
        <section className="bg-white pb-12">
          <Container>
            <div className="grid gap-3 lg:grid-cols-[2fr_1fr]">
              <div className="relative min-h-[420px] overflow-hidden rounded-3xl bg-slate-100">
                <CatalogImage src={gallery[0]} alt={development.name} priority className="object-cover" />
              </div>
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-1">
                {gallery.slice(1, 3).map((image) => (
                  <div key={image} className="relative min-h-48 overflow-hidden rounded-2xl bg-slate-100">
                    <CatalogImage src={image} alt={development.name} className="object-cover" />
                  </div>
                ))}
              </div>
            </div>
          </Container>
        </section>

        <section className="py-14">
          <Container>
            <div className="grid gap-10 lg:grid-cols-[1fr_380px]">
              <div>
                <div className="flex flex-wrap gap-2">
                  {development.program && <span className="rounded-full bg-emerald-100 px-3 py-1.5 text-sm font-bold text-emerald-800">{development.program}</span>}
                  {development.developer && <span className="rounded-full bg-blue-100 px-3 py-1.5 text-sm font-bold text-blue-800">{development.developer}</span>}
                </div>
                <h1 className="mt-5 text-4xl font-extrabold text-slate-950 md:text-5xl">{development.name}</h1>
                <p className="mt-3 flex items-center gap-2 text-slate-500"><MapPin size={18} /> {development.address || `${development.city} - ${development.state}`}</p>
                <div className="mt-8 grid grid-cols-2 gap-4 rounded-2xl bg-white p-5 shadow-sm sm:grid-cols-4">
                  <Info icon={<BedDouble />} label="Dormitórios" value={development.bedroomsMin?.toString() ?? "Consulte"} />
                  <Info icon={<Bath />} label="Banheiros" value={development.bathroomsMin?.toString() ?? "Consulte"} />
                  <Info icon={<Car />} label="Vagas" value={development.parkingMin?.toString() ?? "Consulte"} />
                  <Info icon={<Maximize2 />} label="Área" value={development.areaMin ? `${development.areaMin} m²` : "Consulte"} />
                </div>

                <div className="mt-10 rounded-3xl bg-white p-7 shadow-sm">
                  <h2 className="text-2xl font-extrabold text-slate-900">Sobre o empreendimento</h2>
                  <p className="mt-4 whitespace-pre-line leading-8 text-slate-600">{development.description}</p>
                  {development.features.length > 0 && (
                    <div className="mt-8 grid gap-3 sm:grid-cols-2">
                      {development.features.map((feature) => <div key={feature} className="flex items-center gap-2 text-slate-700"><CheckCircle2 size={18} className="text-emerald-600" /> {feature}</div>)}
                    </div>
                  )}
                </div>

                {units.length > 0 && (
                  <div className="mt-10">
                    <h2 className="text-2xl font-extrabold text-slate-900">Unidades disponíveis</h2>
                    <div className="mt-5 grid gap-4 sm:grid-cols-2">
                      {units.map((unit) => (
                        <article key={unit.id} className="rounded-2xl border border-slate-200 bg-white p-5">
                          <div className="flex items-start justify-between gap-3">
                            <div><p className="text-sm text-slate-500">{unit.code}</p><h3 className="text-lg font-bold text-slate-900">{unit.title}</h3></div>
                            <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-800">Disponível</span>
                          </div>
                          <p className="mt-4 text-xl font-extrabold text-blue-950">{formatCurrency(unit.price)}</p>
                          <p className="mt-2 text-sm text-slate-500">{unit.bedrooms ?? "-"} dorm. · {unit.area ? `${unit.area} m²` : "área sob consulta"}</p>
                        </article>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <aside className="h-fit rounded-3xl bg-white p-6 shadow-lg lg:sticky lg:top-28">
                <p className="text-sm text-slate-500">Valores a partir de</p>
                <p className="mt-1 text-3xl font-extrabold text-blue-950">{formatCurrency(development.priceFrom)}</p>
                <h2 className="mt-7 text-xl font-extrabold text-slate-900">Receba condições e simulação</h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">Seu cadastro entra diretamente no atendimento comercial da Moratta.</p>
                <div className="mt-6"><InterestForm propertyInterest={development.name} developmentId={development.id} /></div>
              </aside>
            </div>
          </Container>
        </section>
      </main>
      <WhatsAppFloat />
      <Footer />
    </>
  );
}

function Info({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <div><div className="text-blue-900">{icon}</div><p className="mt-2 text-xs text-slate-500">{label}</p><p className="font-bold text-slate-900">{value}</p></div>;
}
