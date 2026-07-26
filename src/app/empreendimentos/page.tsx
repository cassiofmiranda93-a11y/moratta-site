import type { Metadata } from "next";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import WhatsAppFloat from "@/components/layout/WhatsAppFloat";
import DevelopmentCatalog from "@/components/catalog/DevelopmentCatalog";
import { Container } from "@/components/ui";

export const metadata: Metadata = {
  title: "Empreendimentos | Moratta Imóveis",
  description: "Encontre casas, apartamentos e lotes em Gravataí e Região Metropolitana com atendimento completo da Moratta Imóveis.",
};

export default function DevelopmentsPage() {
  return (
    <>
      <Navbar />
      <main>
        <section className="bg-gradient-to-br from-blue-950 to-blue-800 py-20 text-white">
          <Container>
            <p className="font-semibold text-[#E7C468]">CATÁLOGO MORATTA</p>
            <h1 className="mt-3 max-w-3xl text-4xl font-extrabold md:text-5xl">Encontre o imóvel certo para o seu momento.</h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-blue-100">Filtre por cidade e tipo. Ao demonstrar interesse, seu atendimento entra diretamente no CRM da Moratta.</p>
          </Container>
        </section>
        <section className="bg-slate-50 py-16">
          <Container><DevelopmentCatalog /></Container>
        </section>
      </main>
      <WhatsAppFloat />
      <Footer />
    </>
  );
}
