"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Clock3, Eye, MessageCircle, Search, Sparkles, Target, UserRoundCheck } from "lucide-react";
import { assessLead, priorityLabel } from "@/lib/atlasCrm";
import { subscribeToWebsiteLeads } from "@/services/adminService";
import type { AtlasPriority, WebsiteLeadRecord } from "@/types/admin";
import LeadDetailDrawer from "./LeadDetailDrawer";

const PRIORITIES: Array<["all" | AtlasPriority, string]> = [
  ["all", "Todas"],
  ["critical", "Urgentes"],
  ["high", "Altas"],
  ["medium", "Médias"],
  ["low", "Baixas"],
];

export default function AtlasOpportunitiesPanel({ currentBrokerId = "" }: { currentBrokerId?: string }) {
  const [leads, setLeads] = useState<WebsiteLeadRecord[]>([]);
  const [query, setQuery] = useState("");
  const [priority, setPriority] = useState<"all" | AtlasPriority>("all");
  const [message, setMessage] = useState("");
  const [selectedLead, setSelectedLead] = useState<WebsiteLeadRecord | null>(null);

  useEffect(() => subscribeToWebsiteLeads(setLeads, (error) => setMessage(error.message), currentBrokerId || undefined), [currentBrokerId]);

  const assessed = useMemo(() => leads
    .filter((lead) => lead.stage !== "lost")
    .map((lead) => ({ lead, assessment: assessLead(lead) }))
    .sort((a, b) => b.assessment.score - a.assessment.score), [leads]);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return assessed.filter(({ lead, assessment }) => {
      const matchesPriority = priority === "all" || assessment.priority === priority;
      const matchesQuery = !term || [lead.name, lead.city, lead.propertyInterest, assessment.nextAction].join(" ").toLowerCase().includes(term);
      return matchesPriority && matchesQuery;
    });
  }, [assessed, priority, query]);

  const overdue = assessed.filter(({ assessment }) => assessment.alerts.includes("Retorno vencido")).length;
  const unassigned = assessed.filter(({ lead }) => !lead.assignedTo).length;
  const hot = assessed.filter(({ assessment }) => assessment.priority === "critical" || assessment.priority === "high").length;

  return <section>
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div><p className="flex items-center gap-2 text-sm font-bold text-blue-800"><Sparkles size={17}/> ATLAS COMERCIAL</p><h1 className="text-3xl font-extrabold text-slate-950">Central de oportunidades</h1><p className="mt-2 text-slate-500">Priorização automática por etapa, qualificação, atividade e prazo de retorno.</p></div>
      <label className="relative w-full max-w-sm"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18}/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar cliente ou interesse" className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4"/></label>
    </div>
    {message && <p className="mt-4 rounded-xl bg-amber-50 p-4 text-sm text-amber-800">{message}</p>}

    <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Metric icon={<Target/>} label="Leads prioritários" value={hot} note="urgência alta ou crítica"/>
      <Metric icon={<Clock3/>} label="Retornos vencidos" value={overdue} note="ação recomendada hoje"/>
      <Metric icon={<UserRoundCheck/>} label="Sem corretor" value={unassigned} note="aguardando distribuição"/>
      <Metric icon={<Sparkles/>} label="Base analisada" value={assessed.length} note="avaliação por regras Atlas"/>
    </div>

    <div className="mt-6 flex flex-wrap gap-2">{PRIORITIES.map(([value, label]) => <button key={value} onClick={() => setPriority(value)} className={`rounded-full px-4 py-2 text-sm font-bold ${priority === value ? "bg-blue-950 text-white" : "bg-white text-slate-600"}`}>{label}</button>)}</div>

    <div className="mt-6 grid gap-4 xl:grid-cols-2">
      {filtered.map(({ lead, assessment }) => <article key={lead.id} className="rounded-2xl bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h2 className="truncate text-lg font-extrabold text-slate-950">{lead.name}</h2><PriorityBadge priority={assessment.priority}/></div><p className="mt-1 text-sm text-slate-500">{lead.propertyInterest || "Interesse ainda não definido"} · {lead.city || "Cidade não informada"}</p></div>
          <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-blue-50"><div className="text-center"><p className="text-xl font-extrabold text-blue-950">{assessment.score}</p><p className="text-[10px] font-bold text-blue-700">SCORE</p></div></div>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2"><Info label="Chance estimada" value={`${assessment.probability}%`}/><Info label="Próxima ação" value={assessment.nextAction}/></div>
        {assessment.alerts.length > 0 && <div className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-800"><div className="flex items-start gap-2"><AlertTriangle className="mt-0.5 shrink-0" size={17}/><span>{assessment.alerts.join(" · ")}</span></div></div>}
        <div className="mt-4 flex flex-wrap gap-2">{assessment.reasons.map((reason) => <span key={reason} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{reason}</span>)}</div>
        <div className="mt-5 flex gap-2"><a href={`https://wa.me/55${lead.phone}?text=${encodeURIComponent(assessment.suggestedWhatsapp)}`} target="_blank" rel="noreferrer" className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-50 px-4 py-2.5 font-bold text-emerald-700"><MessageCircle size={17}/> Mensagem sugerida</a><button onClick={() => setSelectedLead(lead)} className="flex items-center justify-center gap-2 rounded-xl bg-blue-50 px-4 py-2.5 font-bold text-blue-800"><Eye size={17}/> Abrir</button></div>
      </article>)}
      {filtered.length === 0 && <div className="col-span-full rounded-2xl bg-white py-16 text-center text-slate-400">Nenhuma oportunidade encontrada com estes filtros.</div>}
    </div>
    {selectedLead && <LeadDetailDrawer lead={selectedLead} onClose={() => setSelectedLead(null)}/>} 
  </section>;
}

function Metric({ icon, label, value, note }: { icon: React.ReactNode; label: string; value: number; note: string }) { return <div className="rounded-2xl bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><p className="text-sm font-semibold text-slate-500">{label}</p><span className="text-blue-800">{icon}</span></div><p className="mt-3 text-4xl font-extrabold text-slate-950">{value}</p><p className="mt-1 text-xs text-slate-400">{note}</p></div>; }
function Info({ label, value }: { label: string; value: string }) { return <div className="rounded-xl bg-slate-50 p-3"><p className="text-xs font-semibold text-slate-500">{label}</p><p className="mt-1 text-sm font-bold text-slate-800">{value}</p></div>; }
function PriorityBadge({ priority }: { priority: AtlasPriority }) { const classes = { critical: "bg-red-100 text-red-700", high: "bg-amber-100 text-amber-700", medium: "bg-blue-100 text-blue-700", low: "bg-slate-100 text-slate-600" }; return <span className={`rounded-full px-3 py-1 text-xs font-extrabold ${classes[priority]}`}>{priorityLabel(priority)}</span>; }
