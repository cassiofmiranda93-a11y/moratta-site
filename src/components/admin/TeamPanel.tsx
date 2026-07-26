"use client";

import { FormEvent, useEffect, useState } from "react";
import { Plus, UserRound } from "lucide-react";
import { saveBroker, subscribeToBrokers, toggleBroker } from "@/services/adminService";
import type { BrokerRecord } from "@/types/admin";

export default function TeamPanel() {
  const [brokers, setBrokers] = useState<BrokerRecord[]>([]);
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  useEffect(() => subscribeToBrokers(setBrokers, (error) => setMessage(error.message)), []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await saveBroker({ name: String(form.get("name") ?? "").trim(), email: String(form.get("email") ?? "").trim(), phone: String(form.get("phone") ?? "").replace(/\D/g, ""), creci: String(form.get("creci") ?? "").trim(), active: true });
    event.currentTarget.reset(); setOpen(false); setMessage("Corretor cadastrado.");
  }

  return <section><div className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-sm font-bold text-blue-800">EQUIPE</p><h1 className="text-3xl font-extrabold text-slate-950">Corretores</h1><p className="mt-2 text-slate-500">Cadastre responsáveis para distribuir os leads recebidos.</p></div><button onClick={() => setOpen(true)} className="flex items-center gap-2 rounded-xl bg-blue-950 px-5 py-3 font-bold text-white"><Plus size={18}/> Novo corretor</button></div>{message && <p className="mt-4 rounded-xl bg-blue-50 p-4 text-sm text-blue-800">{message}</p>}<div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{brokers.map((broker) => <article key={broker.id} className="rounded-2xl bg-white p-5 shadow-sm"><div className="flex items-start gap-3"><div className="rounded-xl bg-blue-50 p-3 text-blue-900"><UserRound/></div><div className="min-w-0"><h2 className="truncate font-extrabold text-slate-900">{broker.name}</h2><p className="truncate text-sm text-slate-500">{broker.email || broker.phone}</p><p className="mt-1 text-xs text-slate-400">{broker.creci || "CRECI não informado"}</p></div></div><button onClick={() => toggleBroker(broker.id, !broker.active)} className={`mt-5 w-full rounded-xl px-4 py-2 text-sm font-bold ${broker.active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{broker.active ? "Ativo — clique para desativar" : "Inativo — clique para ativar"}</button></article>)}</div>{open && <div className="fixed inset-0 z-[110] grid place-items-center bg-slate-950/60 p-4"><form onSubmit={handleSubmit} className="w-full max-w-lg rounded-3xl bg-white p-7 shadow-2xl"><h2 className="text-2xl font-extrabold">Novo corretor</h2><div className="mt-6 space-y-4">{[["name","Nome"],["email","E-mail"],["phone","WhatsApp"],["creci","CRECI"]].map(([name,label]) => <label key={name} className="block"><span className="mb-1 block text-sm font-semibold">{label}</span><input name={name} required={name === "name"} className="h-12 w-full rounded-xl border border-slate-200 px-4"/></label>)}</div><div className="mt-6 flex justify-end gap-3"><button type="button" onClick={() => setOpen(false)} className="rounded-xl border px-5 py-3 font-bold">Cancelar</button><button className="rounded-xl bg-blue-950 px-5 py-3 font-bold text-white">Salvar</button></div></form></div>}</section>;
}
