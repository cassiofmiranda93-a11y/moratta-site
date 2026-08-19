import Image from "next/image";
import type { Metadata } from "next";
import { Check } from "lucide-react";
import QuickLeadForm from "@/components/landing/QuickLeadForm";

export const metadata: Metadata = {
  title: "Simule seu imóvel",
  description: "Faça uma simulação rápida para comprar seu imóvel com a Moratta Imóveis.",
};

export default function SimulationLandingPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <section className="mx-auto grid min-h-screen max-w-6xl items-center gap-10 px-5 py-8 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
        <div className="mx-auto max-w-xl lg:mx-0">
          <Image src="/images/logo/logo-moratta.png" alt="Moratta Imóveis" width={170} height={70} className="h-auto w-[145px] object-contain" priority />

          <div className="mt-9 inline-flex rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-blue-950">
            Simulação gratuita
          </div>

          <h1 className="mt-5 text-4xl font-black leading-[1.08] tracking-tight text-slate-950 sm:text-5xl">
            Descubra se seu imóvel próprio cabe no seu orçamento.
          </h1>

          <p className="mt-5 max-w-lg text-base leading-7 text-slate-600 sm:text-lg">
            Responda algumas perguntas rápidas e receba uma análise inicial para financiamento, FGTS e condições disponíveis.
          </p>

          <div className="mt-7 space-y-3 text-sm font-medium text-slate-700">
            {["Leva menos de 1 minuto", "Sem compromisso", "Atendimento humano pelo WhatsApp"].map((item) => (
              <div key={item} className="flex items-center gap-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-700"><Check size={15} strokeWidth={3} /></span>
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="mx-auto w-full max-w-xl rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] sm:p-9 lg:p-10">
          <QuickLeadForm />
        </div>
      </section>
    </main>
  );
}
