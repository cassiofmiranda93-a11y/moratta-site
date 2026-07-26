import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  MessageCircle,
} from "lucide-react";

import { Container } from "@/components/ui";

export default function Hero() {
  const whatsappUrl =
    `https://wa.me/5551996594956?text=${encodeURIComponent("Olá! Quero saber mais sobre financiamento e imóveis disponíveis.")}`;

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#102A46] via-[#173B63] to-[#1E4D7B] text-white">
      <div className="absolute inset-0">
        <div className="absolute -left-40 top-16 h-80 w-80 rounded-full bg-[#D9AA45]/10 blur-3xl" />
        <div className="absolute -right-32 bottom-0 h-96 w-96 rounded-full bg-white/5 blur-3xl" />
      </div>

      <Container>
        <div className="relative grid min-h-[720px] items-center gap-14 py-16 lg:grid-cols-2 lg:py-20">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur">
              <BadgeCheck size={17} className="text-[#E7C468]" />
              Especialistas em financiamento imobiliário
            </span>

            <h1 className="mt-7 text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              Seu primeiro imóvel está mais perto do que você imagina.
            </h1>

            <p className="mt-6 max-w-xl text-base leading-7 text-slate-200 sm:text-lg sm:leading-8">
              A Moratta acompanha você desde a análise do crédito até a entrega
              das chaves, com orientação clara, atendimento próximo e imóveis
              selecionados em Gravataí e Região Metropolitana.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link href="#empreendimentos" className="inline-flex items-center justify-center rounded-xl bg-white px-6 py-3 font-bold text-blue-950 shadow-lg hover:bg-slate-100">
                Ver empreendimentos
                <ArrowRight className="ml-2" size={18} />
              </Link>

              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-xl border-2 border-white px-6 py-3 font-bold text-white hover:bg-white hover:text-blue-950"
              >
                <MessageCircle className="mr-2" size={18} />
                Falar no WhatsApp
              </a>
            </div>

            <div className="mt-9 grid gap-3 text-sm text-slate-200 sm:grid-cols-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={17} className="text-[#E7C468]" />
                Análise de crédito
              </div>

              <div className="flex items-center gap-2">
                <CheckCircle2 size={17} className="text-[#E7C468]" />
                Uso do FGTS
              </div>

              <div className="flex items-center gap-2">
                <CheckCircle2 size={17} className="text-[#E7C468]" />
                Acompanhamento completo
              </div>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-xl lg:mx-0">
            <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-white/5 p-2 shadow-2xl">
              <Image
                src="/images/hero/hero-1.jpeg"
                alt="Família realizando o sonho da casa própria"
                width={900}
                height={700}
                priority
                className="h-[420px] w-full rounded-[22px] object-cover sm:h-[520px]"
              />

              <div className="absolute inset-x-2 bottom-2 rounded-b-[22px] bg-gradient-to-t from-[#102A46]/90 via-[#102A46]/45 to-transparent px-6 pb-6 pt-20">
                <p className="text-sm font-medium text-slate-200">
                  Seu caminho até o imóvel próprio
                </p>

                <p className="mt-1 text-xl font-bold">
                  Atendimento do início ao fim
                </p>
              </div>
            </div>

            <div className="absolute -bottom-6 left-4 right-4 rounded-2xl bg-white p-5 text-slate-900 shadow-2xl sm:-left-8 sm:right-auto sm:w-[320px]">
              <div className="flex items-start gap-3">
                <div className="rounded-xl bg-[#D9AA45]/15 p-2.5">
                  <BadgeCheck className="text-[#D9AA45]" size={24} />
                </div>

                <div>
                  <h2 className="font-bold">Financiamento facilitado</h2>

                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    Orientação para Caixa, FGTS e Minha Casa Minha Vida.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}