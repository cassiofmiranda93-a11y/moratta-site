"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Building2, CalendarClock, ReceiptText, Target, TrendingUp, Trophy, Users, WalletCards } from "lucide-react";

import { hasPermission } from "@/lib/permissions";
import { subscribeToBrokers, subscribeToSales, subscribeToWebsiteLeads } from "@/services/adminService";
import type { BrokerRecord, SaleRecord, UserRole, WebsiteLeadRecord } from "@/types/admin";

function money(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function dateOnly(value: string) {
  return value ? new Date(`${value}T12:00:00`) : null;
}

function inRange(value: string, period: string) {
  if (period === "all") return true;
  const date = dateOnly(value);
  if (!date || Number.isNaN(date.getTime())) return false;
  const now = new Date();
  if (period === "month") return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  const start = new Date(now); start.setDate(start.getDate() - Number(period));
  return date >= start && date <= now;
}

function isFutureWithin(value: string, days: number) {
  const date = dateOnly(value);
  if (!date) return false;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const limit = new Date(today); limit.setDate(limit.getDate() + days);
  return date >= today && date <= limit;
}

export default function DirectorateDashboard({
  userRole,
  currentBrokerId = "",
}: {
  userRole: UserRole;
  currentBrokerId?: string;
}) {
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [leads, setLeads] = useState<WebsiteLeadRecord[]>([]);
  const [brokers, setBrokers] = useState<BrokerRecord[]>([]);
  const [period, setPeriod] = useState("month");
  const [brokerId, setBrokerId] = useState("");
  const [development, setDevelopment] = useState("");
  const [message, setMessage] = useState("");
  const canViewBrokerRanking = hasPermission(userRole, "view_broker_ranking");

  useEffect(() => subscribeToSales(setSales, (error) => setMessage(error.message), currentBrokerId || undefined), [currentBrokerId]);
  useEffect(() => subscribeToWebsiteLeads(setLeads, (error) => setMessage(error.message), currentBrokerId || undefined), [currentBrokerId]);
  useEffect(() => subscribeToBrokers(setBrokers, (error) => setMessage(error.message)), []);

  const developments = useMemo(() => Array.from(new Set(sales.map((sale) => sale.developmentId).filter(Boolean))).sort(), [sales]);
  const filteredSales = useMemo(() => sales.filter((sale) => sale.status !== "cancelled" && inRange(sale.saleDate, period) && (!brokerId || sale.brokerId === brokerId) && (!development || sale.developmentId === development)), [sales, period, brokerId, development]);
  const filteredLeads = useMemo(() => leads.filter((lead) => (!brokerId || lead.assignedTo === brokerId) && (!development || lead.developmentId === development || lead.propertyInterest === development)), [leads, brokerId, development]);

  const stats = useMemo(() => {
    const installments = filteredSales.flatMap((sale) => sale.installments.map((installment) => ({ ...installment, sale })));
    const propertyValue = filteredSales.reduce((sum, sale) => sum + sale.propertyValue, 0);
    const expected = installments.filter((item) => item.status !== "cancelled").reduce((sum, item) => sum + item.amount, 0);
    const received = installments.reduce((sum, item) => sum + item.receivedAmount, 0);
    const pending = Math.max(0, expected - received);
    const now = new Date();
    const overdue = installments.filter((item) => {
      const due = dateOnly(item.expectedAt);
      return due && due < new Date(now.getFullYear(), now.getMonth(), now.getDate()) && !["received", "cancelled"].includes(item.status) && item.receivedAmount < item.amount;
    });
    const invoicePending = filteredSales.filter((sale) => sale.invoiceExpectedAt && !sale.invoiceIssuedAt);
    const byBroker = canViewBrokerRanking ? brokers.map((broker) => {
      const brokerSales = filteredSales.filter((sale) => sale.brokerId === broker.id);
      const revenue = brokerSales.flatMap((sale) => sale.installments).reduce((sum, item) => sum + item.amount, 0);
      return { broker, count: brokerSales.length, revenue };
    }).filter((item) => item.count > 0).sort((a, b) => b.revenue - a.revenue || b.count - a.count) : [];
    const byPayer = Object.entries(filteredSales.reduce<Record<string, number>>((acc, sale) => {
      const key = sale.payerName || "Pagador não informado";
      acc[key] = (acc[key] || 0) + sale.installments.reduce((sum, item) => sum + item.amount, 0);
      return acc;
    }, {})).sort((a, b) => b[1] - a[1]);
    const forecast = [7, 30, 60, 90].map((days) => ({ days, value: installments.filter((item) => !["received", "cancelled"].includes(item.status) && isFutureWithin(item.expectedAt, days)).reduce((sum, item) => sum + Math.max(0, item.amount - item.receivedAmount), 0) }));
    const wonLeads = filteredLeads.filter((lead) => ["contract", "won"].includes(lead.stage)).length;
    const conversion = filteredLeads.length ? wonLeads / filteredLeads.length * 100 : 0;
    return { propertyValue, expected, received, pending, overdue, invoicePending, byBroker, byPayer, forecast, conversion };
  }, [filteredSales, filteredLeads, brokers, canViewBrokerRanking]);

  return <section>
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div><p className="text-sm font-bold text-blue-800">DIRETORIA MORATTA</p><h1 className="text-3xl font-extrabold text-slate-950">Desempenho e previsão de receita</h1><p className="mt-2 text-slate-500">Visão gerencial de vendas, comissões, notas fiscais, recebimentos e produtividade.</p></div>
      <div className="grid w-full gap-2 md:grid-cols-3 xl:w-auto">
        <select value={period} onChange={(event) => setPeriod(event.target.value)} className="h-12 rounded-xl border border-slate-200 bg-white px-4 font-semibold"><option value="month">Mês atual</option><option value="30">Últimos 30 dias</option><option value="90">Últimos 90 dias</option><option value="all">Todo o período</option></select>
        <select value={brokerId} onChange={(event) => setBrokerId(event.target.value)} className="h-12 rounded-xl border border-slate-200 bg-white px-4 font-semibold"><option value="">Todos os corretores</option>{brokers.map((broker) => <option key={broker.id} value={broker.id}>{broker.name}</option>)}</select>
        <select value={development} onChange={(event) => setDevelopment(event.target.value)} className="h-12 rounded-xl border border-slate-200 bg-white px-4 font-semibold"><option value="">Todos os empreendimentos</option>{developments.map((item) => <option key={item}>{item}</option>)}</select>
      </div>
    </div>
    {message && <p className="mt-4 rounded-xl bg-amber-50 p-4 text-sm text-amber-800">{message}</p>}

    <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Metric icon={<Building2/>} label="Vendas registradas" value={String(filteredSales.length)} note={`${money(stats.propertyValue)} em imóveis`}/>
      <Metric icon={<TrendingUp/>} label="Comissão prevista" value={money(stats.expected)} note="receita bruta projetada"/>
      <Metric icon={<WalletCards/>} label="Receita recebida" value={money(stats.received)} note={`${money(stats.pending)} ainda pendente`}/>
      <Metric icon={<Target/>} label="Conversão comercial" value={`${stats.conversion.toFixed(1)}%`} note={`${filteredLeads.length} leads no filtro`}/>
    </div>

    <div className="mt-7 grid gap-6 xl:grid-cols-2">
      <Card title="Previsão de entrada" subtitle="Valores pendentes acumulados por horizonte">
        <div className="grid gap-3 sm:grid-cols-2">{stats.forecast.map((item) => <div key={item.days} className="rounded-2xl bg-blue-50 p-4"><div className="flex items-center justify-between"><p className="text-sm font-bold text-blue-800">Próximos {item.days} dias</p><CalendarClock className="text-blue-700" size={18}/></div><p className="mt-2 text-2xl font-extrabold text-blue-950">{money(item.value)}</p></div>)}</div>
      </Card>
      <Card title="Pendências financeiras" subtitle="Itens que precisam de acompanhamento">
        <div className="space-y-3"><Alert icon={<ReceiptText size={18}/>} label="Notas fiscais previstas e não emitidas" value={stats.invoicePending.length}/><Alert icon={<AlertTriangle size={18}/>} label="Parcelas vencidas ou incompletas" value={stats.overdue.length}/><Alert icon={<WalletCards size={18}/>} label="Total financeiro pendente" value={money(stats.pending)}/></div>
      </Card>
      {canViewBrokerRanking && <Card title="Ranking por receita" subtitle="Corretores ordenados pela comissão prevista">
        <div className="space-y-3">{stats.byBroker.slice(0, 8).map((item, index) => <div key={item.broker.id} className="flex items-center gap-3 rounded-xl border border-slate-100 p-3"><div className="grid h-9 w-9 place-items-center rounded-full bg-blue-50 font-extrabold text-blue-950">{index + 1}</div><div className="min-w-0 flex-1"><p className="truncate font-bold text-slate-900">{item.broker.name}</p><p className="text-xs text-slate-500">{item.count} venda{item.count === 1 ? "" : "s"} · {money(item.revenue)}</p></div>{index === 0 && <Trophy className="text-amber-500" size={20}/>}</div>)}{stats.byBroker.length === 0 && <Empty/>}</div>
      </Card>}
      <Card title="Receita por empresa pagadora" subtitle="Construtoras e parceiros responsáveis pelo pagamento">
        <div className="space-y-3">{stats.byPayer.slice(0, 8).map(([payer, value]) => <div key={payer} className="flex items-center justify-between rounded-xl bg-slate-50 p-4"><div className="flex min-w-0 items-center gap-3"><Users className="shrink-0 text-blue-800" size={18}/><span className="truncate font-semibold text-slate-700">{payer}</span></div><span className="font-extrabold text-slate-900">{money(value)}</span></div>)}{stats.byPayer.length === 0 && <Empty/>}</div>
      </Card>
    </div>
  </section>;
}

function Metric({ icon, label, value, note }: { icon: React.ReactNode; label: string; value: string; note: string }) { return <div className="rounded-2xl bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><p className="text-sm font-semibold text-slate-500">{label}</p><span className="text-blue-800">{icon}</span></div><p className="mt-3 text-3xl font-extrabold text-slate-950">{value}</p><p className="mt-1 text-xs text-slate-400">{note}</p></div>; }
function Card({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) { return <section className="rounded-2xl bg-white p-6 shadow-sm"><h2 className="text-xl font-extrabold text-slate-900">{title}</h2><p className="mt-1 text-sm text-slate-500">{subtitle}</p><div className="mt-5">{children}</div></section>; }
function Alert({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) { return <div className="flex items-center justify-between gap-4 rounded-xl bg-slate-50 p-4"><div className="flex items-center gap-3 text-slate-700"><span className="text-blue-800">{icon}</span><span className="font-semibold">{label}</span></div><span className="rounded-full bg-white px-3 py-1 text-sm font-extrabold text-slate-900">{value}</span></div>; }
function Empty() { return <p className="py-8 text-center text-sm text-slate-400">Ainda não há dados suficientes.</p>; }
