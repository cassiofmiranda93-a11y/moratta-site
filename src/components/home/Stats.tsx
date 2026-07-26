import { Award, Building2, Users, Handshake } from "lucide-react";
import { Container } from "@/components/ui";

const stats = [
  {
    icon: Award,
    value: "13+",
    label: "Anos de experiência",
  },
  {
    icon: Building2,
    value: "500+",
    label: "Imóveis vendidos",
  },
  {
    icon: Users,
    value: "1000+",
    label: "Clientes atendidos",
  },
  {
    icon: Handshake,
    value: "100%",
    label: "Atendimento personalizado",
  },
];

export default function Stats() {
  return (
    <section className="bg-blue-900 py-16 text-white">
      <Container>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.label}
                className="rounded-2xl bg-white/10 p-8 text-center backdrop-blur transition hover:bg-white/20"
              >
                <Icon className="mx-auto mb-5" size={42} />

                <h3 className="text-4xl font-bold">
                  {item.value}
                </h3>

                <p className="mt-2 text-blue-100">
                  {item.label}
                </p>
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}