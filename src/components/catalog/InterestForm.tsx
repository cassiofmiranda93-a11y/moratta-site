"use client";

import { FormEvent, useMemo, useState } from "react";
import { CheckCircle2, Send } from "lucide-react";
import { createWebsiteLead } from "@/services/leadService";

export default function InterestForm({
  propertyInterest,
  developmentId = "",
  propertyId = "",
}: {
  propertyInterest: string;
  developmentId?: string;
  propertyId?: string;
}) {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const currentForm = event.currentTarget;
    setStatus("loading");
    setMessage("");
    const form = new FormData(currentForm);
    try {
      await createWebsiteLead({
        name: String(form.get("name") ?? ""),
        phone: String(form.get("phone") ?? ""),
        email: String(form.get("email") ?? ""),
        city: String(form.get("city") ?? ""),
        message: String(form.get("message") ?? ""),
        propertyInterest,
        developmentId,
        propertyId,
        landingPage: window.location.pathname,
        ...utm,
      });
      setStatus("success");
      setMessage("Recebemos seu interesse. Um corretor da Moratta entrará em contato.");
      currentForm.reset();
    } catch (error) {
      const text = error instanceof Error ? error.message : "Não foi possível enviar agora.";
      setStatus("error");
      setMessage(text.includes("permission") || text.includes("already-exists")
        ? "Seu cadastro já está no nosso atendimento. Vamos falar com você pelo WhatsApp."
        : text);
    }
  }

  if (status === "success") {
    return (
      <div className="rounded-2xl bg-emerald-50 p-6 text-emerald-800">
        <CheckCircle2 className="mb-3" size={32} />
        <p className="font-bold">Interesse enviado!</p>
        <p className="mt-2 text-sm leading-6">{message}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1.5 block text-sm font-semibold text-slate-700">Nome</label>
        <input name="name" required className="h-12 w-full rounded-xl border border-slate-200 px-4 outline-none focus:border-blue-700" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-slate-700">WhatsApp</label>
          <input name="phone" required inputMode="tel" placeholder="(51) 99999-9999" className="h-12 w-full rounded-xl border border-slate-200 px-4 outline-none focus:border-blue-700" />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-slate-700">Cidade</label>
          <input name="city" className="h-12 w-full rounded-xl border border-slate-200 px-4 outline-none focus:border-blue-700" />
        </div>
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-semibold text-slate-700">E-mail</label>
        <input name="email" type="email" className="h-12 w-full rounded-xl border border-slate-200 px-4 outline-none focus:border-blue-700" />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-semibold text-slate-700">Mensagem</label>
        <textarea name="message" rows={3} defaultValue={`Tenho interesse em ${propertyInterest}.`} className="w-full rounded-xl border border-slate-200 p-4 outline-none focus:border-blue-700" />
      </div>
      {status === "error" && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{message}</p>}
      <button disabled={status === "loading"} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-950 font-bold text-white transition hover:bg-blue-800 disabled:opacity-60">
        <Send size={18} /> {status === "loading" ? "Enviando..." : "Quero falar com um corretor"}
      </button>
      <p className="text-xs leading-5 text-slate-500">Ao enviar, você autoriza o contato da Moratta Imóveis sobre este imóvel.</p>
    </form>
  );
}

