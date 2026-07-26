import Link from "next/link";
import { Container, SectionTitle } from "@/components/ui";
import DevelopmentCatalog from "@/components/catalog/DevelopmentCatalog";

export default function Projects() {
  return (
    <section id="empreendimentos" className="bg-slate-50 py-24">
      <Container>
        <SectionTitle
          title="Empreendimentos em destaque"
          subtitle="Conheça oportunidades selecionadas pela Moratta para diferentes perfis de renda e momento de compra."
        />
        <div className="mt-12">
          <DevelopmentCatalog compact />
        </div>
        <div className="mt-10 text-center">
          <Link href="/empreendimentos" className="inline-flex rounded-xl border border-blue-950 px-6 py-3 font-bold text-blue-950 transition hover:bg-blue-950 hover:text-white">
            Ver todos os empreendimentos
          </Link>
        </div>
      </Container>
    </section>
  );
}
