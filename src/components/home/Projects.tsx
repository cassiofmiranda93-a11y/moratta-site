import Link from "next/link";
import { Container, SectionTitle } from "@/components/ui";
import DevelopmentCatalog from "@/components/catalog/DevelopmentCatalog";

export default function Projects() {
  return (
    <section id="empreendimentos" className="bg-white py-20 lg:py-24">
      <Container>
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <SectionTitle
            center={false}
            title="Oportunidades em destaque"
            subtitle="Imóveis escolhidos para facilitar sua busca."
          />
          <Link
            href="/empreendimentos"
            className="inline-flex shrink-0 items-center font-bold text-blue-900 hover:text-blue-700"
          >
            Ver todos os imóveis
          </Link>
        </div>
        <div className="mt-10">
          <DevelopmentCatalog compact />
        </div>
      </Container>
    </section>
  );
}
