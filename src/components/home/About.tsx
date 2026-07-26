import { Award, Home, Users } from "lucide-react";
import { Container, SectionTitle } from "@/components/ui";

export default function About() {
  const items = [
    {
      icon: <Award className="h-10 w-10 text-blue-900" />,
      title: "13 anos de experiência",
      description:
        "Mais de uma década ajudando famílias a conquistarem seu imóvel.",
    },
    {
      icon: <Users className="h-10 w-10 text-blue-900" />,
      title: "+500 clientes atendidos",
      description:
        "Atendimento consultivo do primeiro contato até a entrega das chaves.",
    },
    {
      icon: <Home className="h-10 w-10 text-blue-900" />,
      title: "Especialistas em financiamento",
      description:
        "Análise de crédito gratuita e acompanhamento completo do processo.",
    },
  ];

  return (
    <section id="sobre" className="bg-white py-24">
      <Container>
        <SectionTitle
          title="Por que escolher a Moratta?"
          subtitle="Atendimento personalizado, segurança jurídica e experiência para encontrar o imóvel ideal."
        />

        <div className="grid gap-8 md:grid-cols-3">
          {items.map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="mb-6">{item.icon}</div>

              <h3 className="mb-3 text-xl font-bold text-gray-900">
                {item.title}
              </h3>

              <p className="leading-7 text-gray-600">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}