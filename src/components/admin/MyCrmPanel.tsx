"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  Clock3,
  MessageCircle,
  Search,
  Target,
  UserRound,
  UsersRound,
} from "lucide-react";
import { subscribeToWebsiteLeads } from "@/services/adminService";
import type { WebsiteLeadRecord } from "@/types/admin";
import LeadDetailDrawer from "./LeadDetailDrawer";

const STAGES = [
  ["new", "Novo lead"], ["contacted", "Contato realizado"], ["documents", "Documentação"],
  ["credit_analysis", "Análise de crédito"], ["approved", "Aprovado"], ["visit", "Visita"],
  ["proposal", "Proposta"], ["reserved", "Reserva"], ["contract", "Contrato"], ["won", "Venda concluída"],
] as const;

const stageLabel = (stage: string) => STAGES.find(([value]) => value === stage)?.[1] ?? stage;

function localDateKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function isOverdue(value: string | null) {
  return Boolean(value && new Date(value).getTime() < Date.now());
}

function isToday(value: string | null) {
  return Boolean(value && value.slice(0, 10) === localDateKey());
}

function whatsappLink(phone: string) {
  let digits = phone.replace(/\D/g, "");
  if (!digits.startsWith("55")) digits = `55${digits}`;
  return `https://wa.me/${digits}`;
}

export default function MyCrmPanel({ currentBrokerId, brokerName }: { currentBrokerId: string; brokerName?: string }) {
  const [leads, setLeads] = useState<WebsiteLeadRecord[]>([]);
  const [selectedLead, setSelectedLead] = useState<WebsiteLeadRecord | null>(null);
  const [query, setQuery] = useState("");
  const [quickFilter, setQuickFilter] = useState<"all" | "new" | "today" | "overdue" | "advanced">("all");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!currentBrokerId) return;
    return subscribeToWebsiteLeads(setLeads, (error) => setMessage(error.message), currentBrokerId);
  }, [currentBrokerId]);

  const active = useMemo(() => leads.filter((lead) => lead.stage !== "lost"), [leads]);
  const newLeads = active.filter((lead) => lead.stage === "new");
  const today = active.filter((lead) => isToday(lead.nextContactAt));
  const overdue = active.filter((lead) => isOverdue(lead.nextContactAt) && !isToday(lead.nextContactAt));
  const advanced = active.filter((lead) => ["approved", "visit", "proposal", "reserved", "contract"].includes(lead.stage));
  const won = active.filter((lead) => lead.stage === "won");

  const filtered = useMemo(() => {
    const term = query.trim().toLocaleLowerCase("pt-BR");
    return active.filter((lead) => {
      const matchesTerm = !term || [lead.name, lead.phone, lead.email, lead.city, lead.propertyInterest]
        .join(" ").toLocaleLowerCase("pt-BR").includes(term);
      const matchesQuick = quickFilter === "all" ||
        (quickFilter === "new" && lead.stage === "new") ||
        (quickFilter === "today" && isToday(lead.nextContactAt)) ||
        (quickFilter === "overdue" && isOverdue(lead.nextContactAt) && !isToday(lead.nextContactAt)) ||
        (quickFilter === "advanced" && ["approved", "visit", "proposal", "reserved", "contract"].includes(lead.stage));
      return matchesTerm && matchesQuick;
    });
  }, [active, query, quickFilter]);

  const nextActions = useMemo(() => [...active]
    .filter((lead) => lead.nextContactAt)
    .sort((a, b) => (a.nextContactAt ?? "").localeCompare(b.nextContactAt ?? ""))
    .slice(0, 6), [active]);

  if (!currentBrokerId) {
    return <section className="rounded-3xl bg-white p-8 shadow-sm"><h1 className="text-3xl font-extrabold text-slate-950">Meu CRM</h1><p className="mt-3 max-w-2xl text-slate-500">Seu usuário ainda não está vinculado a um cadastro de corretor. Cadastre o mesmo e-mail em <strong>Equipe e acessos</strong> para que sua carteira pessoal seja identificada.</p></section>;
  }

  return <div className="space-y-6">
    <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-blue-950 via-blue-900 to-blue-700 p-6 text-white shadow-sm sm:p-8">
      <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-blue-200">Área pessoal de vendas</p>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-4"><div><h1 className="text-3xl font-extrabold sm:text-4xl">Meu CRM</h1><p className="mt-2 text-blue-100">{brokerName ? `${brokerName}, aqui` : "Aqui"} estão somente os clientes da sua carteira.</p></div><div className="rounded-2xl bg-white/10 px-5 py-3"><p className="text-3xl font-extrabold">{active.length}</p><p className="text-xs font-bold uppercase text-blue-100">clientes ativos</p></div></div>
    </section>

    {message && <p className="rounded-xl bg-amber-50 p-4 text-sm font-semibold text-amber-800">{message}</p>}

    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      <Metric icon={<UserRound size={20}/>} label="Novos" value={newLeads.length} note="aguardando contato" onClick={() => setQuickFilter("new")}/>
      <Metric icon={<CalendarClock size={20}/>} label="Retornos hoje" value={today.length} note="agenda de hoje" onClick={() => setQuickFilter("today")}/>
      <Metric icon={<Clock3 size={20}/>} label="Atrasados" value={overdue.length} note="precisam de ação" onClick={() => setQuickFilter("overdue")}/>
      <Metric icon={<Target size={20}/>} label="Em negociação" value={advanced.length} note="etapas avançadas" onClick={() => setQuickFilter("advanced")}/>
      <Metric icon={<CheckCircle2 size={20}/>} label="Vendas" value={won.length} note="concluídas na carteira" onClick={() => setQuickFilter("all")}/>
    </div>

    <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
      <section className="rounded-2xl bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-xl font-extrabold text-slate-950">Meus clientes</h2><p className="text-sm text-slate-500">Trabalhe sua carteira sem misturar os clientes da equipe.</p></div><button onClick={() => setQuickFilter("all")} className="text-sm font-bold text-blue-800">Ver todos</button></div>
        <div className="mt-5 flex flex-wrap gap-2">
          <div className="relative min-w-[220px] flex-1"><Search className="absolute left-3 top-3 text-slate-400" size={18}/><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar cliente, telefone, cidade..." className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-blue-700"/></div>
          <select value={quickFilter} onChange={(e) => setQuickFilter(e.target.value as typeof quickFilter)} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700"><option value="all">Toda a carteira</option><option value="new">Novos</option><option value="today">Retornos hoje</option><option value="overdue">Atrasados</option><option value="advanced">Em negociação</option></select>
        </div>
        <div className="mt-4 divide-y divide-slate-100">
          {filtered.slice(0, 30).map((lead) => <article key={lead.id} className="flex flex-wrap items-center gap-3 py-4">
            <button onClick={() => setSelectedLead(lead)} className="min-w-0 flex-1 text-left"><p className="truncate font-extrabold text-slate-900">{lead.name}</p><p className="mt-1 truncate text-sm text-slate-500">{lead.propertyInterest || lead.city || lead.phone}</p></button>
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-800">{stageLabel(lead.stage)}</span>
            {lead.nextContactAt && <span className={`text-xs font-semibold ${isOverdue(lead.nextContactAt) ? "text-red-600" : "text-slate-500"}`}>{new Date(lead.nextContactAt).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}</span>}
            <a href={whatsappLink(lead.phone)} target="_blank" rel="noreferrer" className="rounded-xl bg-emerald-50 p-2.5 text-emerald-700" title="WhatsApp"><MessageCircle size={18}/></a>
            <button onClick={() => setSelectedLead(lead)} className="rounded-xl bg-slate-100 p-2.5 text-slate-700"><ChevronRight size={18}/></button>
          </article>)}
          {filtered.length === 0 && <div className="py-12 text-center"><UsersRound className="mx-auto text-slate-300" size={36}/><p className="mt-3 font-bold text-slate-700">Nenhum cliente neste filtro.</p></div>}
        </div>
      </section>

      <aside className="space-y-6">
        <section className="rounded-2xl bg-white p-5 shadow-sm"><h2 className="font-extrabold text-slate-950">Próximas ações</h2><p className="mt-1 text-sm text-slate-500">Retornos agendados da sua carteira.</p><div className="mt-4 space-y-3">{nextActions.map((lead) => <button key={lead.id} onClick={() => setSelectedLead(lead)} className="w-full rounded-xl border border-slate-100 p-3 text-left transition hover:border-blue-200 hover:bg-blue-50"><p className="font-bold text-slate-900">{lead.name}</p><p className={`mt-1 text-xs font-semibold ${isOverdue(lead.nextContactAt) ? "text-red-600" : "text-slate-500"}`}>{lead.nextContactAt ? new Date(lead.nextContactAt).toLocaleString("pt-BR") : ""}</p></button>)}{nextActions.length === 0 && <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">Nenhum retorno agendado.</p>}</div></section>
        <section className="rounded-2xl bg-white p-5 shadow-sm"><h2 className="font-extrabold text-slate-950">Meu funil</h2><div className="mt-4 space-y-3">{STAGES.filter(([stage]) => stage !== "won").map(([stage, label]) => { const count = active.filter((lead) => lead.stage === stage).length; return <div key={stage}><div className="flex justify-between text-xs font-bold text-slate-600"><span>{label}</span><span>{count}</span></div><div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-blue-800" style={{ width: `${active.length ? Math.max(4, count / active.length * 100) : 0}%` }}/></div></div>})}</div></section>
      </aside>
    </div>

    {selectedLead && <LeadDetailDrawer lead={selectedLead} onClose={() => setSelectedLead(null)} />}
  </div>;
}

function Metric({ icon, label, value, note, onClick }: { icon: ReactNode; label: string; value: number; note: string; onClick: () => void }) {
  return <button onClick={onClick} className="rounded-2xl bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"><div className="flex items-center justify-between"><span className="rounded-xl bg-blue-50 p-2.5 text-blue-900">{icon}</span><span className="text-3xl font-extrabold text-slate-950">{value}</span></div><p className="mt-4 font-extrabold text-slate-900">{label}</p><p className="mt-1 text-xs text-slate-500">{note}</p></button>;
}
