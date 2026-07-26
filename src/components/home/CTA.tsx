import { ArrowRight, PhoneCall } from "lucide-react";
import { Container } from "@/components/ui";

export default function CTA() {
  return (
    <section id="analise" className="bg-blue-900 py-24">
      <Container>
        <div className="mx-auto max-w-4xl text-center text-white">

          <div className="mb-6 flex justify-center">
            <div className="rounded-full bg-white/10 p-5">
              <PhoneCall size={36} />
            </div>
          </div>

          <h2 className="text-4xl font-bold leading-tight md:text-5xl">
            Descubra gratuitamente quanto você pode financiar.
          </h2>

          <p className="mx-auto mt-6 max-w-2xl text-lg text-blue-100">
            Faça uma análise de crédito sem compromisso e descubra quais imóveis
            estão dentro da sua renda.
          </p>

          <div className="mt-10">
            <a href="https://wa.me/5551996594956?text=Ol%C3%A1%21%20Quero%20fazer%20uma%20an%C3%A1lise%20de%20cr%C3%A9dito." target="_blank" rel="noopener noreferrer" className="mx-auto inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 font-bold text-blue-900 hover:bg-gray-100">Quero minha análise gratuita<ArrowRight size={18} /></a>
          </div>

        </div>
      </Container>
    </section>
  );
}
