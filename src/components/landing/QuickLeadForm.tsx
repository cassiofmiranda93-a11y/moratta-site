"use client";

import { FormEvent, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";
import { createWebsiteLead } from "@/services/leadService";

const cities = ["Gravataí", "Cachoeirinha", "Canoas", "Porto Alegre", "Outra cidade"];
const incomeOptions = [
  { label: "Até R$ 2.500", value: 2500 },
  { label: "R$ 2.500 a R$ 4.000", value: 3250 },
  { label: "R$ 4.000 a R$ 6.000", value: 5000 },
  { label: "Acima de R$ 6.000", value: 7000 },
];
const propertyOptions = ["Apartamento", "Casa", "Tanto faz"];

export default function QuickLeadForm() {
  const [step, setStep] = useState(0);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState("");
  const [data, setData] = useState({
    name: "",
    phone: "",
    city: "",
    income: 0,
    hasFgts: false,
    fgtsAnswered: false,
    propertyInterest: "",
  });

  const utm = useMemo(() => {
    if (typeof window === "undefined") return {};
    const params = new URLSearchParams(window.location.search);
    return {
      utmSource: params.get("utm_source") ?? "",
      utmMedium: params.get("utm_medium") ?? "",
      utmCampaign: params.get("utm_campaign") ?? "",
      utmContent: params.get("utm_content") ?? "",
      utmTerm: params.get("utm_term") ?? "",
      campaign: params.get("campaign") ?? "",
      adSet: params.get("adset") ?? "",
      ad: params.get("ad") ?? "",
    };
  }, []);

  const steps = 6;
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
    setStatus("loading");
    setError("");
    try {
      await createWebsiteLead({
        name: data.name,
        phone: data.phone,
        city: data.city,
        propertyInterest: data.propertyInterest,
        monthlyIncome: data.income,
        hasFgts: data.hasFgts,
        message: `Landing MCMV | Interesse: ${data.propertyInterest || "não informado"} | Renda aproximada: R$ ${data.income.toLocaleString("pt-BR")} | FGTS: ${data.hasFgts ? "sim" : "não"}`,
        landingPage: window.location.pathname,
        source: "landing",
        ...utm,
      });
      setStatus("success");
    } catch (err) {
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
            <h2 className="text-2xl font-bold tracking-tight text-slate-950">Como podemos te chamar?</h2>
            <p className="mt-2 text-sm text-slate-500">Digite apenas seu primeiro nome.</p>
            <input
              autoFocus
              value={data.name}
              onChange={(e) => setData({ ...data, name: e.target.value })}
              placeholder="Seu nome"
              className="mt-7 h-14 w-full rounded-2xl border border-slate-200 px-4 text-base outline-none focus:border-blue-950"
            />
            <button type="button" disabled={!data.name.trim()} onClick={next} className="mt-5 flex h-13 w-full items-center justify-center gap-2 rounded-2xl bg-blue-950 font-bold text-white disabled:cursor-not-allowed disabled:opacity-40">
              Continuar <ArrowRight size={18} />
            </button>
          </div>
        )}

        {step === 1 && (
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-950">Qual cidade você procura?</h2>
            <p className="mt-2 text-sm text-slate-500">Escolha a opção mais próxima do que você quer.</p>
            <div className="mt-6 grid gap-3">
              {cities.map((city) => (
                <button key={city} type="button" onClick={() => { setData({ ...data, city }); setTimeout(next, 120); }} className={`min-h-14 rounded-2xl border px-4 text-left font-semibold ${data.city === city ? "border-blue-950 bg-blue-50 text-blue-950" : "border-slate-200 bg-white text-slate-800 hover:border-slate-300"}`}>
                  {city}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-950">Qual sua renda familiar?</h2>
            <p className="mt-2 text-sm text-slate-500">Pode ser uma estimativa. Isso ajuda a direcionar a simulação.</p>
            <div className="mt-6 grid gap-3">
              {incomeOptions.map((option) => (
                <button key={option.label} type="button" onClick={() => { setData({ ...data, income: option.value }); setTimeout(next, 120); }} className={`min-h-14 rounded-2xl border px-4 text-left font-semibold ${data.income === option.value ? "border-blue-950 bg-blue-50 text-blue-950" : "border-slate-200 bg-white text-slate-800 hover:border-slate-300"}`}>
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-950">Você possui FGTS?</h2>
            <p className="mt-2 text-sm text-slate-500">Escolha uma opção.</p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              {[{ label: "Sim", value: true }, { label: "Não", value: false }].map((option) => (
                <button key={option.label} type="button" onClick={() => { setData({ ...data, hasFgts: option.value, fgtsAnswered: true }); setTimeout(next, 120); }} className="min-h-16 rounded-2xl border border-slate-200 bg-white px-4 font-bold text-slate-800 hover:border-blue-950 hover:bg-blue-50">
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 4 && (
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-950">O que você procura?</h2>
            <p className="mt-2 text-sm text-slate-500">Não precisa decidir agora. É só para entendermos seu perfil.</p>
            <div className="mt-6 grid gap-3">
              {propertyOptions.map((option) => (
                <button key={option} type="button" onClick={() => { setData({ ...data, propertyInterest: option }); setTimeout(next, 120); }} className={`min-h-14 rounded-2xl border px-4 text-left font-semibold ${data.propertyInterest === option ? "border-blue-950 bg-blue-50 text-blue-950" : "border-slate-200 bg-white text-slate-800 hover:border-slate-300"}`}>
                  {option}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 5 && (
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-950">Para onde enviamos sua análise?</h2>
            <p className="mt-2 text-sm text-slate-500">Seu WhatsApp será usado somente para atendimento da Moratta.</p>
            <input
              autoFocus
              inputMode="tel"
              value={data.phone}
              onChange={(e) => setData({ ...data, phone: e.target.value })}
              placeholder="(51) 99999-9999"
              className="mt-7 h-14 w-full rounded-2xl border border-slate-200 px-4 text-base outline-none focus:border-blue-950"
            />
            {error && <p className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
            <button type="submit" disabled={status === "loading" || data.phone.replace(/\D/g, "").length < 10} className="mt-5 flex h-13 w-full items-center justify-center gap-2 rounded-2xl bg-blue-950 font-bold text-white disabled:cursor-not-allowed disabled:opacity-40">
              {status === "loading" ? "Enviando..." : "Quero receber minha simulação"}
            </button>
            <p className="mt-3 text-center text-[11px] leading-5 text-slate-400">Ao continuar, você autoriza o contato da Moratta Imóveis sobre sua simulação.</p>
          </div>
        )}
      </div>

      {step > 0 && step < steps && (
        <button type="button" onClick={back} className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-slate-500 hover:text-slate-900">
          <ArrowLeft size={16} /> Voltar
        </button>
      )}
    </form>
  );
}
