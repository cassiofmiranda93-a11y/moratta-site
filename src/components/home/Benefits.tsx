import { BadgeCheck, House, KeyRound } from "lucide-react";
import { Container } from "@/components/ui";

export default function Benefits() {
  const benefits = [
    {
      number: "01",
      title: "Conte o que procura",
      description:
        "Entendemos sua renda, sua região e o tipo de imóvel ideal.",
      icon: House,
    },
    {
      number: "02",
      title: "Confira suas possibilidades",
      description:
        "Analisamos financiamento, FGTS e condições disponíveis.",
      icon: BadgeCheck,
    },
    {
      number: "03",
      title: "Compre com tranquilidade",
      description:
        "Acompanhamos documentos, contrato e entrega das chaves.",
      icon: KeyRound,
    },
  ];

  return (
    <section className="bg-[#f5f7fa] py-20 lg:py-24">
      <Container>
        <div className="max-w-2xl">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-900">
            Um caminho simples
          </p>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-950 md:text-4xl">
            Comprar seu imóvel em três passos
          </h2>
          <p className="mt-4 text-lg leading-8 text-slate-600">
            Sem complicação e com orientação em cada decisão.
          </p>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {benefits.map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-slate-200 bg-white p-7"
            >
              <div className="flex items-center justify-between">
                <span className="rounded-lg bg-blue-50 p-2.5 text-blue-900">
                  <item.icon size={23} />
                </span>
                <span className="text-sm font-extrabold text-slate-300">{item.number}</span>
              </div>
              <h3 className="mt-7 text-xl font-bold text-slate-950">
                {item.title}
              </h3>
              <p className="mt-3 leading-7 text-slate-600">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
