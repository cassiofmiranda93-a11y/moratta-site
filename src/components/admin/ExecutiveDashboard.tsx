"use client";

import { useEffect, useMemo, useState } from "react";
import { Target, TrendingUp, UserRoundCheck, Users, Clock3, Trophy } from "lucide-react";

import { hasPermission } from "@/lib/permissions";
import { subscribeToBrokers, subscribeToWebsiteLeads } from "@/services/adminService";
import type { BrokerRecord, UserRole, WebsiteLeadRecord } from "@/types/admin";

const WON = new Set(["won", "contract"]);

export default function ExecutiveDashboard({
  userRole,
  currentBrokerId = "",
}: {
  userRole: UserRole;
  currentBrokerId?: string;
}) {
  const [leads, setLeads] = useState<WebsiteLeadRecord[]>([]);
  const [brokers, setBrokers] = useState<BrokerRecord[]>([]);
  const [message, setMessage] = useState("");
  const canViewBrokerRanking = hasPermission(userRole, "view_broker_ranking");
  useEffect(() => subscribeToWebsiteLeads(setLeads, (error) => setMessage(error.message), currentBrokerId || undefined), [currentBrokerId]);
  useEffect(() => subscribeToBrokers(setBrokers, (error) => setMessage(error.message)), []);

  const stats = useMemo(() => {
    const now = new Date();
    const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const today = leads.filter((lead) => lead.createdAt && new Date(lead.createdAt) >= startToday).length;
    const month = leads.filter((lead) => lead.createdAt && new Date(lead.createdAt) >= startMonth).length;
    const won = leads.filter((lead) => WON.has(lead.stage)).length;
    const conversion = leads.length ? (won / leads.length) * 100 : 0;
    const overdue = leads.filter((lead) => lead.nextContactAt && new Date(lead.nextContactAt) < now && !WON.has(lead.stage) && lead.stage !== "lost").length;
    const byBroker = canViewBrokerRanking
      ? brokers.map((broker) => ({ broker, total: leads.filter((lead) => lead.assignedTo === broker.id && lead.stage !== "lost").length, won: leads.filter((lead) => lead.assignedTo === broker.id && WON.has(lead.stage)).length })).sort((a, b) => b.won - a.won || b.total - a.total)
      : [];
    return { today, month, won, conversion, overdue, byBroker };
  }, [leads, brokers, canViewBrokerRanking]);

  const stageData = useMemo(() => {
    const labels: Record<string, string> = { new: "Novos", contacted: "Contato", documents: "Documentos", credit_analysis: "Crédito", approved: "Aprovados", visit: "Visitas", proposal: "Propostas", reserved: "Reservas", contract: "Contratos", won: "Vendas", lost: "Perdidos" };
    return Object.entries(labels).map(([key, label]) => ({ key, label, value: leads.filter((lead) => lead.stage === key).length })).filter((item) => item.value > 0);
  }, [leads]);

  const sources = useMemo(() => Object.entries(leads.reduce<Record<string, number>>((acc, lead) => { const source = lead.campaign || lead.utmSource || lead.source || "Não informado"; acc[source] = (acc[source] || 0) + 1; return acc; }, {})).sort((a, b) => b[1] - a[1]).slice(0, 6), [leads]);
  const maxStage = Math.max(1, ...stageData.map((item) => item.value));
  const maxSource = Math.max(1, ...sources.map((item) => item[1]));

  return <section>
    <div><p className="text-sm font-bold text-blue-800">CRM COMERCIAL</p><h1 className="text-3xl font-extrabold text-slate-950">Dashboard executivo</h1><p className="mt-2 text-slate-500">Acompanhe aquisição, conversão, produtividade e pendências.</p></div>
    {message && <p className="mt-4 rounded-xl bg-amber-50 p-4 text-sm text-amber-800">{message}</p>}
    <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      <Metric icon={<UserRoundCheck/>} label="Leads hoje" value={stats.today.toString()} note={`${stats.month} no mês`} />
      <Metric icon={<TrendingUp/>} label="Leads totais" value={leads.length.toString()} note="base comercial" />
      <Metric icon={<Target/>} label="Conversão" value={`${stats.conversion.toFixed(1)}%`} note={`${stats.won} negócios ganhos`} />
      <Metric icon={<Clock3/>} label="Retornos vencidos" value={stats.overdue.toString()} note="exigem atenção" />
      <Metric icon={<Users/>} label="Corretores ativos" value={brokers.filter((broker) => broker.active).length.toString()} note={`${brokers.length} cadastrados`} />
    </div>
    <div className="mt-7 grid gap-6 xl:grid-cols-2">
      <Card title="Funil de vendas" subtitle="Distribuição atual por etapa">
        <div className="space-y-4">{stageData.map((item) => <div key={item.key}><div className="mb-1 flex justify-between text-sm"><span className="font-semibold text-slate-700">{item.label}</span><span className="font-bold text-slate-900">{item.value}</span></div><div className="h-3 rounded-full bg-slate-100"><div className="h-3 rounded-full bg-blue-950" style={{ width: `${Math.max(5, item.value / maxStage * 100)}%` }}/></div></div>)}{stageData.length === 0 && <Empty/>}</div>
      </Card>
      <Card title="Origem dos leads" subtitle="Campanhas e canais com maior volume">
        <div className="space-y-4">{sources.map(([source, value]) => <div key={source}><div className="mb-1 flex justify-between text-sm"><span className="truncate font-semibold text-slate-700">{source}</span><span className="font-bold">{value}</span></div><div className="h-3 rounded-full bg-slate-100"><div className="h-3 rounded-full bg-emerald-600" style={{ width: `${Math.max(5, value / maxSource * 100)}%` }}/></div></div>)}{sources.length === 0 && <Empty/>}</div>
      </Card>
      {canViewBrokerRanking && <Card title="Ranking de corretores" subtitle="Ordenado por vendas e carteira">
        <div className="space-y-3">{stats.byBroker.slice(0, 8).map((item, index) => <div key={item.broker.id} className="flex items-center gap-3 rounded-xl border border-slate-100 p-3"><div className="grid h-9 w-9 place-items-center rounded-full bg-blue-50 font-extrabold text-blue-950">{index + 1}</div><div className="min-w-0 flex-1"><p className="truncate font-bold text-slate-900">{item.broker.name}</p><p className="text-xs text-slate-500">{item.total} leads · {item.won} vendas</p></div>{index === 0 && <Trophy className="text-amber-500" size={20}/>}</div>)}{stats.byBroker.length === 0 && <Empty/>}</div>
      </Card>}
      <Card title="Alertas comerciais" subtitle="O que precisa de ação agora">
        <div className="space-y-3"><Alert value={leads.filter((lead) => !lead.assignedTo).length} label="leads sem responsável"/><Alert value={stats.overdue} label="retornos vencidos"/><Alert value={leads.filter((lead) => lead.stage === "new").length} label="leads ainda sem contato"/><Alert value={leads.filter((lead) => lead.stage === "documents").length} label="clientes aguardando documentos"/></div>
      </Card>
    </div>
  </section>;
}

function Metric({ icon, label, value, note }: { icon: React.ReactNode; label: string; value: string; note: string }) { return <div className="rounded-2xl bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><p className="text-sm font-semibold text-slate-500">{label}</p><span className="text-blue-800">{icon}</span></div><p className="mt-3 text-4xl font-extrabold text-slate-950">{value}</p><p className="mt-1 text-xs text-slate-400">{note}</p></div>; }
function Card({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) { return <section className="rounded-2xl bg-white p-6 shadow-sm"><h2 className="text-xl font-extrabold text-slate-900">{title}</h2><p className="mt-1 text-sm text-slate-500">{subtitle}</p><div className="mt-5">{children}</div></section>; }
function Alert({ value, label }: { value: number; label: string }) { return <div className="flex items-center justify-between rounded-xl bg-slate-50 p-4"><span className="font-semibold text-slate-700">{label}</span><span className={`rounded-full px-3 py-1 text-sm font-extrabold ${value ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"}`}>{value}</span></div>; }
function Empty() { return <p className="py-8 text-center text-sm text-slate-400">Ainda não há dados suficientes.</p>; }
