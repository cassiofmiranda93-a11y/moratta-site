"use client";

import { FormEvent, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";
import { trackMetaLeadOnce } from "@/lib/metaPixel";
import { createWebsiteLead } from "@/services/leadService";

const cities = ["Gravataí", "Cachoeirinha", "Canoas", "Porto Alegre", "Outra cidade"];
const incomeOptions = [
  { label: "Até R$ 2.000", value: 2000 },
  { label: "R$ 2.000 a R$ 3.000", value: 2500 },
  { label: "R$ 3.000 a R$ 3.500", value: 3250 },
  { label: "R$ 3.500 a R$ 4.500", value: 4000 },
  { label: "Acima de R$ 4.500", value: 5000 },
];

function getAttributionParams() {
  if (typeof window === "undefined") return {};

  const params = new URLSearchParams(window.location.search);
  const utmCampaign = params.get("utm_campaign") ?? "";

  return {
    utmSource: params.get("utm_source") ?? "",
    utmMedium: params.get("utm_medium") ?? "",
    utmCampaign,
    utmContent: params.get("utm_content") ?? "",
    utmTerm: params.get("utm_term") ?? "",
    campaign: params.get("campaign") || utmCampaign,
    adSet: params.get("adset") ?? "",
    ad: params.get("ad") ?? "",
  };
}

export default function QuickLeadForm() {
  const submitInProgressRef = useRef(false);
  const metaLeadStateRef = useRef({ tracked: false });
  const [step, setStep] = useState(0);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState("");
  const [data, setData] = useState({
    city: "",
    income: 0,
    incomeRange: "",
    name: "",
    phone: "",
  });

  const steps = 4;
  const progress = ((step + 1) / steps) * 100;

  function next() {
    setError("");
    setStep((current) => Math.min(current + 1, steps - 1));
  }

  function back() {
    setError("");
    setStep((current) => Math.max(current - 1, 0));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (submitInProgressRef.current || status === "success") return;

    submitInProgressRef.current = true;
    setStatus("loading");
    setError("");

    try {
      await createWebsiteLead({
        name: data.name,
        phone: data.phone,
        city: data.city,
        monthlyIncome: data.income,
        incomeRange: data.incomeRange,
        message: `Landing MCMV | Renda familiar: ${data.incomeRange}`,
        landingPage: window.location.pathname,
        source: "landing",
        ...getAttributionParams(),
      });

      trackMetaLeadOnce(metaLeadStateRef.current);
      setStatus("success");
    } catch (err) {
      submitInProgressRef.current = false;
      setStatus("error");
      setError(err instanceof Error ? err.message : "Não foi possível enviar agora.");
    }
  }

  if (status === "success") {
    return (
      <div className="flex min-h-[430px] flex-col items-center justify-center text-center">
        <CheckCircle2 size={52} className="mb-5 text-emerald-600" />
        <h2 className="text-2xl font-bold text-slate-950">Pronto! Recebemos seu cadastro.</h2>
        <p className="mt-3 max-w-sm text-sm leading-6 text-slate-600">
          Um corretor da Moratta vai analisar suas informações e falar com você pelo WhatsApp.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="w-full">
      <div className="mb-8">
        <div className="mb-2 flex items-center justify-between text-xs font-semibold text-slate-500">
          <span>Simulação rápida</span>
          <span>{step + 1} de {steps}</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-blue-950 transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="min-h-[300px]">
        {step === 0 && (
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-950">Qual cidade você procura?</h2>
            <p className="mt-2 text-sm text-slate-500">Escolha a opção mais próxima do que você quer.</p>
            <div className="mt-6 grid gap-3">
              {cities.map((city) => (
                <button
                  key={city}
                  type="button"
                  onClick={() => {
                    setData({ ...data, city });
                    setTimeout(next, 120);
                  }}
                  className={`min-h-14 rounded-2xl border px-4 text-left font-semibold ${
                    data.city === city
                      ? "border-blue-950 bg-blue-50 text-blue-950"
                      : "border-slate-200 bg-white text-slate-800 hover:border-slate-300"
                  }`}
                >
                  {city}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 1 && (
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-950">Qual é a sua renda familiar mensal?</h2>
            <p className="mt-2 text-sm text-slate-500">Pode ser uma estimativa. Isso ajuda a direcionar a simulação.</p>
            <div className="mt-6 grid gap-3">
              {incomeOptions.map((option) => (
                <button
                  key={option.label}
                  type="button"
                  onClick={() => {
                    setData({ ...data, income: option.value, incomeRange: option.label });
                    setTimeout(next, 120);
                  }}
                  className={`min-h-14 rounded-2xl border px-4 text-left font-semibold ${
                    data.incomeRange === option.label
                      ? "border-blue-950 bg-blue-50 text-blue-950"
                      : "border-slate-200 bg-white text-slate-800 hover:border-slate-300"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-950">Como podemos te chamar?</h2>
            <p className="mt-2 text-sm text-slate-500">Digite apenas seu primeiro nome.</p>
            <input
              autoFocus
              value={data.name}
              onChange={(event) => setData({ ...data, name: event.target.value })}
              placeholder="Seu nome"
              className="mt-7 h-14 w-full rounded-2xl border border-slate-200 px-4 text-base outline-none focus:border-blue-950"
            />
            <button
              type="button"
              disabled={!data.name.trim()}
              onClick={next}
              className="mt-5 flex h-13 w-full items-center justify-center gap-2 rounded-2xl bg-blue-950 font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              Continuar <ArrowRight size={18} />
            </button>
          </div>
        )}

        {step === 3 && (
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-950">Receba sua simulação pelo WhatsApp</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Informe seu WhatsApp para nossa equipe analisar seu perfil e apresentar as opções disponíveis.
            </p>
            <input
              autoFocus
              inputMode="tel"
              value={data.phone}
              onChange={(event) => setData({ ...data, phone: event.target.value })}
              placeholder="(51) 99999-9999"
              className="mt-7 h-14 w-full rounded-2xl border border-slate-200 px-4 text-base outline-none focus:border-blue-950"
            />
            {error && <p className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
            <button
              type="submit"
              disabled={status === "loading" || data.phone.replace(/\D/g, "").length < 10}
              className="mt-5 flex h-13 w-full items-center justify-center gap-2 rounded-2xl bg-blue-950 font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              {status === "loading" ? "Enviando..." : "Quero receber minha simulação"}
            </button>
            <p className="mt-3 text-center text-[11px] leading-5 text-slate-400">
              Ao continuar, você autoriza o contato da Moratta Imóveis sobre sua simulação.
            </p>
          </div>
        )}
      </div>

      {step > 0 && (
        <button type="button" onClick={back} className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-slate-500 hover:text-slate-900">
          <ArrowLeft size={16} /> Voltar
        </button>
      )}
    </form>
  );
}
