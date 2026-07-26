"use client";

import { useEffect, useMemo, useState } from "react";
import { MessageCircle, Phone, Search, UserRoundCheck } from "lucide-react";
import { assignLead, subscribeToBrokers, subscribeToWebsiteLeads, updateLeadStage } from "@/services/adminService";
import type { BrokerRecord, WebsiteLeadRecord } from "@/types/admin";

const STAGES = [
  ["new", "Novo lead"],
  ["contacted", "Contato realizado"],
  ["documents", "Documentação"],
  ["credit_analysis", "Análise de crédito"],
  ["approved", "Aprovado"],
  ["visit", "Visita"],
  ["proposal", "Proposta"],
  ["reserved", "Reserva"],
  ["contract", "Contrato"],
  ["won", "Venda concluída"],
] as const;

export default function AdminLeadsPanel() {
  const [leads, setLeads] = useState<WebsiteLeadRecord[]>([]);
  const [brokers, setBrokers] = useState<BrokerRecord[]>([]);
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => subscribeToWebsiteLeads(setLeads, (error) => setMessage(error.message)), []);
  useEffect(() => subscribeToBrokers(setBrokers, (error) => setMessage(error.message)), []);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return leads;
    return leads.filter((lead) => [lead.name, lead.phone, lead.city, lead.propertyInterest, lead.campaign].join(" ").toLowerCase().includes(term));
  }, [leads, query]);

  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><p className="text-sm font-bold text-blue-800">SITE → CRM</p><h1 className="text-3xl font-extrabold text-slate-950">Leads recebidos</h1><p className="mt-2 text-slate-500">Distribua os contatos e acompanhe a etapa sem sair do site.</p></div>
        <label className="relative w-full max-w-sm"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18}/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar cliente ou empreendimento" className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 outline-none focus:border-blue-700"/></label>
      </div>
      {message && <p className="mt-4 rounded-xl bg-amber-50 p-4 text-sm text-amber-800">{message}</p>}
      <div className="mt-6 overflow-hidden rounded-2xl bg-white shadow-sm">
        <div className="overflow-x-auto"><table className="w-full min-w-[1050px] text-left"><thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500"><tr><th className="p-4">Cliente</th><th className="p-4">Interesse</th><th className="p-4">Origem</th><th className="p-4">Corretor</th><th className="p-4">Etapa</th><th className="p-4">Contato</th></tr></thead><tbody>{filtered.map((lead) => <tr key={lead.id} className="border-t border-slate-100 align-top"><td className="p-4"><p className="font-bold text-slate-900">{lead.name}</p><p className="text-sm text-slate-500">{lead.city || "Cidade não informada"}</p></td><td className="p-4"><p className="font-semibold text-slate-800">{lead.propertyInterest || "Interesse geral"}</p><p className="text-xs text-slate-500">{lead.createdAt ? new Date(lead.createdAt).toLocaleString("pt-BR") : ""}</p></td><td className="p-4 text-sm text-slate-600">{lead.campaign || lead.utmSource || lead.source}</td><td className="p-4"><select value={lead.assignedTo} onChange={async (event) => { await assignLead(lead.id, event.target.value); }} className="h-10 min-w-44 rounded-lg border border-slate-200 px-3"><option value="">Sem responsável</option>{brokers.filter((item) => item.active).map((broker) => <option key={broker.id} value={broker.id}>{broker.name}</option>)}</select></td><td className="p-4"><select value={lead.stage} onChange={async (event) => { await updateLeadStage(lead.id, event.target.value); }} className="h-10 min-w-44 rounded-lg border border-slate-200 px-3">{STAGES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></td><td className="p-4"><div className="flex gap-2"><a href={`tel:+55${lead.phone}`} className="rounded-lg bg-slate-100 p-2 text-slate-700" aria-label="Ligar"><Phone size={17}/></a><a href={`https://wa.me/55${lead.phone}?text=${encodeURIComponent(`Olá, ${lead.name}! Aqui é da Moratta Imóveis. Vi seu interesse em ${lead.propertyInterest || "nossos imóveis"}.`)}`} target="_blank" className="rounded-lg bg-emerald-100 p-2 text-emerald-700" aria-label="WhatsApp"><MessageCircle size={17}/></a></div></td></tr>)}</tbody></table></div>
        {filtered.length === 0 && <div className="py-16 text-center text-slate-500"><UserRoundCheck className="mx-auto mb-3"/><p>Nenhum lead encontrado.</p></div>}
      </div>
    </section>
  );
}
