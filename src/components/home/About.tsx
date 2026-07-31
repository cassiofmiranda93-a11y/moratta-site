import Image from "next/image";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Container } from "@/components/ui";

export default function About() {
  return (
    <section id="sobre" className="bg-white py-20 lg:py-24">
      <Container>
        <div className="grid items-center gap-10 rounded-3xl bg-blue-950 px-7 pt-10 text-white md:grid-cols-[0.75fr_1.25fr] md:px-12 md:pt-0">
          <div className="relative mx-auto h-[330px] w-full max-w-[300px] self-end overflow-hidden">
            <Image
              src="/images/hero/hero-1.jpeg"
              alt="Atendimento Moratta Imóveis"
              fill
              sizes="300px"
              className="object-contain object-bottom"
            />
          </div>
          <div className="py-10 md:py-14">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-200">
              Experiência que orienta
            </p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight md:text-4xl">
              Você decide o imóvel. A Moratta facilita o caminho.
            </h2>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-blue-100">
              São 13 anos de experiência e mais de 500 vendas, com atendimento
              próximo desde a análise de crédito até a entrega das chaves.
            </p>
            <div className="mt-7 flex flex-wrap gap-x-6 gap-y-3 text-sm font-semibold text-white">
              {["Atendimento personalizado", "Segurança no processo"].map((item) => (
                <span key={item} className="flex items-center gap-2">
                  <CheckCircle2 size={17} className="text-emerald-400" />
                  {item}
                </span>
              ))}
            </div>
            <a
              href="#contato"
              className="mt-8 inline-flex items-center gap-2 font-bold text-white hover:text-blue-200"
            >
              Conheça a Moratta <ArrowRight size={17} />
            </a>
          </div>
        </div>
      </Container>
    </section>
  );
}
