"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, Pencil, Plus, ReceiptText, Search, Trash2, TrendingUp, WalletCards } from "lucide-react";
import { deleteSale, subscribeToBrokers, subscribeToSales, subscribeToWebsiteLeads } from "@/services/adminService";
import type { BrokerRecord, SaleRecord, WebsiteLeadRecord } from "@/types/admin";
import SaleFormModal from "./SaleFormModal";

const STATUS_LABELS: Record<SaleRecord["status"], string> = {
  confirmed: "Venda confirmada",
  awaiting_documents: "Aguardando documentação",
  awaiting_invoice: "Aguardando nota fiscal",
  invoice_issued: "Nota fiscal emitida",
  payment_scheduled: "Pagamento programado",
  partially_received: "Recebido parcialmente",
  received: "Recebido",
  overdue: "Pagamento atrasado",
  cancelled: "Cancelado",
};

function money(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function isWithinDays(date: string, days: number) {
  if (!date) return false;
  const target = new Date(`${date}T12:00:00`);
  const now = new Date();
  const limit = new Date(now); limit.setDate(limit.getDate() + days);
  return target >= new Date(now.getFullYear(), now.getMonth(), now.getDate()) && target <= limit;
}

export default function SalesFinancePanel({ currentBrokerId = "" }: { currentBrokerId?: string }) {
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [leads, setLeads] = useState<WebsiteLeadRecord[]>([]);
  const [brokers, setBrokers] = useState<BrokerRecord[]>([]);
  const [editing, setEditing] = useState<SaleRecord | null | undefined>(undefined);
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => subscribeToSales(setSales, (error) => setMessage(error.message), currentBrokerId || undefined), [currentBrokerId]);
  useEffect(() => subscribeToWebsiteLeads(setLeads, (error) => setMessage(error.message), currentBrokerId || undefined), [currentBrokerId]);
  useEffect(() => subscribeToBrokers(setBrokers, (error) => setMessage(error.message)), []);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return sales;
    return sales.filter((sale) => [sale.clientName, sale.payerName, sale.invoiceNumber, sale.developmentId, STATUS_LABELS[sale.status]].join(" ").toLowerCase().includes(term));
  }, [sales, query]);

  const summary = useMemo(() => {
    const active = sales.filter((sale) => sale.status !== "cancelled");
    const expected = active.flatMap((sale) => sale.installments).filter((item) => item.status !== "cancelled").reduce((sum, item) => sum + item.amount, 0);
    const received = active.flatMap((sale) => sale.installments).reduce((sum, item) => sum + item.receivedAmount, 0);
    const next30 = active.flatMap((sale) => sale.installments).filter((item) => !["received", "cancelled"].includes(item.status) && isWithinDays(item.expectedAt, 30)).reduce((sum, item) => sum + Math.max(0, item.amount - item.receivedAmount), 0);
    const invoicePending = active.filter((sale) => !sale.invoiceIssuedAt && sale.invoiceExpectedAt).length;
    return { expected, received, next30, invoicePending };
  }, [sales]);

  async function remove(sale: SaleRecord) {
    if (!window.confirm(`Excluir o registro financeiro de ${sale.clientName}?`)) return;
    try { await deleteSale(sale.id); setMessage("Registro de venda excluído."); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Não foi possível excluir."); }
  }

  function exportCsv() {
    const rows = [["Cliente", "Data da venda", "Empresa pagadora", "Comissão", "Nota fiscal", "Status", "Previsto", "Recebido"]];
    for (const sale of filtered) {
      rows.push([
        sale.clientName,
        sale.saleDate,
        sale.payerName,
        sale.commissionValue.toFixed(2),
        sale.invoiceNumber,
        STATUS_LABELS[sale.status],
        sale.installments.reduce((sum, item) => sum + item.amount, 0).toFixed(2),
        sale.installments.reduce((sum, item) => sum + item.receivedAmount, 0).toFixed(2),
      ]);
    }
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(";")).join("\n");
    const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url; link.download = `moratta-vendas-${new Date().toISOString().slice(0, 10)}.csv`; link.click();
    URL.revokeObjectURL(url);
  }

  return <section>
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div><p className="text-sm font-bold text-blue-800">VENDAS E RECEITAS</p><h1 className="text-3xl font-extrabold text-slate-950">Controle financeiro das vendas</h1><p className="mt-2 text-slate-500">Acompanhe nota fiscal, previsão de pagamento, parcelas, recebimentos e atrasos.</p></div>
      <div className="flex w-full flex-wrap justify-end gap-2 xl:w-auto"><button onClick={exportCsv} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 font-bold text-slate-700"><Download size={18}/> Exportar CSV</button><button onClick={() => setEditing(null)} className="flex items-center gap-2 rounded-xl bg-blue-950 px-5 py-3 font-bold text-white"><Plus size={18}/> Registrar venda</button></div>
    </div>
    {message && <p className="mt-4 rounded-xl bg-blue-50 p-4 text-sm text-blue-800">{message}</p>}

    <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Metric icon={<TrendingUp/>} label="Comissão prevista" value={money(summary.expected)} note="total das parcelas"/>
      <Metric icon={<WalletCards/>} label="Recebido" value={money(summary.received)} note="entrada confirmada"/>
      <Metric icon={<ReceiptText/>} label="Próximos 30 dias" value={money(summary.next30)} note="fluxo de caixa projetado"/>
      <Metric icon={<ReceiptText/>} label="Notas pendentes" value={String(summary.invoicePending)} note="com previsão e sem emissão"/>
    </div>

    <div className="mt-6 flex justify-end"><label className="relative w-full max-w-md"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18}/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar cliente, pagador ou nota" className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4"/></label></div>

    <div className="mt-5 overflow-hidden rounded-2xl bg-white shadow-sm">
      <div className="overflow-x-auto"><table className="w-full min-w-[1150px] text-left"><thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500"><tr><th className="p-4">Cliente/venda</th><th className="p-4">Comissão</th><th className="p-4">Nota fiscal</th><th className="p-4">Recebimentos</th><th className="p-4">Status</th><th className="p-4">Ações</th></tr></thead><tbody>{filtered.map((sale) => {
        const predicted = sale.installments.reduce((sum, item) => sum + item.amount, 0);
        const received = sale.installments.reduce((sum, item) => sum + item.receivedAmount, 0);
        const next = sale.installments.filter((item) => !["received", "cancelled"].includes(item.status) && item.expectedAt).sort((a, b) => a.expectedAt.localeCompare(b.expectedAt))[0];
        return <tr key={sale.id} className="border-t border-slate-100 align-top"><td className="p-4"><p className="font-extrabold text-slate-900">{sale.clientName}</p><p className="mt-1 text-sm text-slate-500">Venda: {sale.saleDate ? new Date(`${sale.saleDate}T12:00:00`).toLocaleDateString("pt-BR") : "não informada"}</p><p className="text-xs text-slate-400">{sale.developmentId || "Empreendimento não informado"}</p></td><td className="p-4"><p className="font-bold text-slate-900">{money(sale.commissionValue)}</p><p className="text-xs text-slate-500">{sale.commissionPercent ? `${sale.commissionPercent}% do imóvel` : "valor informado"}</p><p className="text-xs text-slate-400">Pagador: {sale.payerName || "não informado"}</p></td><td className="p-4"><p className="font-semibold text-slate-800">{sale.invoiceNumber || "Não emitida"}</p><p className="text-xs text-slate-500">Previsão: {sale.invoiceExpectedAt ? new Date(`${sale.invoiceExpectedAt}T12:00:00`).toLocaleDateString("pt-BR") : "não informada"}</p><p className="text-xs text-slate-400">Emissão: {sale.invoiceIssuedAt ? new Date(`${sale.invoiceIssuedAt}T12:00:00`).toLocaleDateString("pt-BR") : "pendente"}</p></td><td className="p-4"><p className="font-bold text-slate-900">{money(received)} de {money(predicted)}</p><div className="mt-2 h-2 w-48 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-emerald-600" style={{ width: `${predicted ? Math.min(100, received / predicted * 100) : 0}%` }}/></div><p className="mt-2 text-xs text-slate-500">{next ? `Próximo: ${new Date(`${next.expectedAt}T12:00:00`).toLocaleDateString("pt-BR")} · ${money(Math.max(0, next.amount - next.receivedAmount))}` : "Sem parcela pendente"}</p></td><td className="p-4"><span className={`inline-flex rounded-full px-3 py-1 text-xs font-extrabold ${sale.status === "received" ? "bg-emerald-100 text-emerald-700" : sale.status === "overdue" ? "bg-red-100 text-red-700" : sale.status === "cancelled" ? "bg-slate-100 text-slate-500" : "bg-amber-100 text-amber-700"}`}>{STATUS_LABELS[sale.status]}</span></td><td className="p-4"><div className="flex gap-2"><button onClick={() => setEditing(sale)} className="rounded-xl bg-blue-50 p-3 text-blue-800" aria-label="Editar"><Pencil size={17}/></button><button onClick={() => remove(sale)} className="rounded-xl bg-red-50 p-3 text-red-700" aria-label="Excluir"><Trash2 size={17}/></button></div></td></tr>;
      })}</tbody></table></div>
      {filtered.length === 0 && <p className="py-16 text-center text-slate-400">Nenhuma venda financeira cadastrada.</p>}
    </div>
    {editing !== undefined && <SaleFormModal sale={editing || undefined} leads={leads} brokers={brokers} onClose={() => setEditing(undefined)} onSaved={() => setMessage("Venda e previsão financeira salvas.")}/>} 
  </section>;
}

function Metric({ icon, label, value, note }: { icon: React.ReactNode; label: string; value: string; note: string }) { return <div className="rounded-2xl bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><p className="text-sm font-semibold text-slate-500">{label}</p><span className="text-blue-800">{icon}</span></div><p className="mt-3 text-3xl font-extrabold text-slate-950">{value}</p><p className="mt-1 text-xs text-slate-400">{note}</p></div>; }
