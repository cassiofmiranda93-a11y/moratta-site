export default function Benefits() {
  const benefits = [
    {
      title: "Especialistas no primeiro imóvel",
      description:
        "Acompanhamento completo para quem deseja conquistar a casa própria com segurança.",
      icon: "🏡",
    },
    {
      title: "Análise de crédito gratuita",
      description:
        "Verificamos sua aprovação antes de iniciar a busca pelo imóvel ideal.",
      icon: "💳",
    },
    {
      title: "Segurança jurídica",
      description:
        "Todo o processo é acompanhado para garantir tranquilidade na compra.",
      icon: "⚖️",
    },
    {
      title: "Atendimento personalizado",
      description:
        "Cada cliente recebe uma orientação de acordo com sua realidade financeira.",
      icon: "🤝",
    },
  ];

  return (
    <section className="bg-white py-24">
      <div className="mx-auto max-w-7xl px-6">

        <div className="mb-14 text-center">
          <h2 className="text-4xl font-bold text-gray-900">
            Por que escolher a Moratta?
          </h2>

          <p className="mt-4 text-lg text-gray-600">
            Cuidamos de todas as etapas para você comprar seu imóvel com tranquilidade.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {benefits.map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="mb-6 text-5xl">{item.icon}</div>

              <h3 className="mb-3 text-xl font-bold text-gray-900">
                {item.title}
              </h3>

              <p className="text-gray-600 leading-7">
                {item.description}
              </p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}