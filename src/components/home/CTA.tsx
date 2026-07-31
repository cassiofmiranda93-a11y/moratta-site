import { ArrowRight, MessageCircle } from "lucide-react";
import { Container } from "@/components/ui";
import { WHATSAPP_URL } from "@/constants/company";

export default function CTA() {
  const whatsappUrl = `${WHATSAPP_URL}?text=${encodeURIComponent(
    "Olá! Quero fazer uma análise de crédito e conhecer os imóveis disponíveis.",
  )}`;

  return (
    <section id="analise" className="bg-white pb-20 lg:pb-24">
      <Container>
        <div className="flex flex-col items-start justify-between gap-8 rounded-3xl bg-[#f1f5f9] p-8 md:flex-row md:items-center md:p-12">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-900">
              Vamos começar?
            </p>
            <h2 className="mt-3 max-w-2xl text-3xl font-extrabold tracking-tight text-slate-950 md:text-4xl">
              Descubra quais imóveis cabem no seu financiamento.
            </h2>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-600">
              Fale com a equipe e faça uma análise sem compromisso.
            </p>
          </div>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-blue-950 px-6 py-3.5 font-bold text-white hover:bg-blue-800"
          >
            <MessageCircle size={18} />
            Falar no WhatsApp
            <ArrowRight size={17} />
          </a>
        </div>
      </Container>
    </section>
  );
}
