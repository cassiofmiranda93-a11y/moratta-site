import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Building2,
  Check,
  MapPin,
  MessageCircle,
} from "lucide-react";

import { Container } from "@/components/ui";
import { WHATSAPP_URL } from "@/constants/company";

export default function Hero() {
  const whatsappUrl = `${WHATSAPP_URL}?text=${encodeURIComponent(
    "Olá! Quero encontrar um imóvel com a Moratta.",
  )}`;

  return (
    <section className="overflow-hidden bg-[#f5f7fa]">
      <Container>
        <div className="grid items-center gap-10 py-12 lg:min-h-[620px] lg:grid-cols-[0.9fr_1.1fr] lg:gap-16 lg:py-16">
          <div className="max-w-xl">
            <p className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.18em] text-blue-900">
              <MapPin size={17} />
              Gravataí e Região Metropolitana
            </p>

            <h1 className="mt-5 text-4xl font-extrabold leading-[1.08] tracking-[-0.04em] text-slate-950 sm:text-5xl lg:text-6xl">
              Encontre um lar que combine com a sua vida.
            </h1>

            <p className="mt-6 max-w-lg text-lg leading-8 text-slate-600">
              Casas, apartamentos e lançamentos selecionados, com orientação
              simples para financiar e comprar com segurança.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="#empreendimentos"
                className="inline-flex items-center justify-center rounded-lg bg-blue-950 px-6 py-3.5 font-bold text-white hover:bg-blue-800"
              >
                Ver imóveis
                <ArrowRight className="ml-2" size={18} />
              </Link>

              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-6 py-3.5 font-bold text-slate-800 hover:border-blue-900 hover:text-blue-900"
              >
                <MessageCircle className="mr-2" size={18} />
                Falar com a Moratta
              </a>
            </div>

            <div className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-sm font-medium text-slate-600">
              {["Financiamento Caixa", "Uso do FGTS", "Minha Casa Minha Vida"].map(
                (item) => (
                  <span key={item} className="flex items-center gap-1.5">
                    <Check size={16} className="text-emerald-600" />
                    {item}
                  </span>
                ),
              )}
            </div>
          </div>

          <div className="relative">
            <div className="relative min-h-[390px] overflow-hidden rounded-2xl bg-slate-200 shadow-[0_24px_70px_rgba(15,23,42,0.12)] sm:min-h-[500px]">
              <Image
                src="/images/projects/campo-belo/campo-belo-1.jpg"
                alt="Casa disponível pela Moratta Imóveis"
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 55vw"
                className="object-cover"
              />

              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/70 to-transparent px-6 pb-6 pt-24 text-white">
                <p className="text-sm font-medium text-white/75">Campo Belo</p>
                <p className="mt-1 text-xl font-bold">Casas com pátio em Gravataí</p>
              </div>
            </div>

            <div className="absolute -bottom-5 left-5 flex items-center gap-3 rounded-xl bg-white px-5 py-4 shadow-xl sm:left-[-28px]">
              <span className="rounded-lg bg-blue-50 p-2.5 text-blue-900">
                <Building2 size={22} />
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Atendimento completo
                </p>
                <p className="font-bold text-slate-900">Da análise às chaves</p>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
