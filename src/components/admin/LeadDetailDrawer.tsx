"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { CalendarClock, CheckCircle2, ClipboardList, MessageCircle, Pencil, ReceiptText, Send, Sparkles, Target, Trash2, X } from "lucide-react";
import { assessLead, priorityLabel } from "@/lib/atlasCrm";
import { addLeadActivity, deleteLead, subscribeToBrokers, subscribeToLeadActivities, subscribeToLeadSales, toggleLeadActivity, updateLeadProfile } from "@/services/adminService";
import { sendWhatsappFromCrm } from "@/services/integrationService";
import type { BrokerRecord, LeadActivityRecord, SaleRecord, WebsiteLeadRecord } from "@/types/admin";
import SaleFormModal from "./SaleFormModal";

function money(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function LeadDetailDrawer({ lead, canDelete = false, onDeleted, onClose }: { lead: WebsiteLeadRecord; canDelete?: boolean; onDeleted?: (name: string) => void; onClose: () => void }) {
  const [activities, setActivities] = useState<LeadActivityRecord[]>([]);
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [brokers, setBrokers] = useState<BrokerRecord[]>([]);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [saleModal, setSaleModal] = useState(false);
  const [whatsappMessage, setWhatsappMessage] = useState(
    () => assessLead(lead).suggestedWhatsapp,
  );

  useEffect(() => subscribeToLeadActivities(lead.id, setActivities, (error) => setMessage(error.message)), [lead.id]);
  useEffect(() => subscribeToLeadSales(lead.id, setSales, (error) => setMessage(error.message)), [lead.id]);
  useEffect(() => subscribeToBrokers(setBrokers, (error) => setMessage(error.message)), []);

  const assessment = useMemo(() => assessLead(lead), [lead]);
  const sale = useMemo(() => sales.find((item) => item.leadId === lead.id), [sales, lead.id]);
  const received = sale?.installments.reduce((sum, item) => sum + item.receivedAmount, 0) ?? 0;
  const predicted = sale?.installments.reduce((sum, item) => sum + item.amount, 0) ?? 0;

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage("");
    try {
      const form = new FormData(event.currentTarget);
      await updateLeadProfile(lead.id, {
        name: String(form.get("name") ?? "").trim(),
        phone: String(form.get("phone") ?? "").replace(/\D/g, ""),
        email: String(form.get("email") ?? "").trim(),
        city: String(form.get("city") ?? "").trim(),
        propertyInterest: String(form.get("propertyInterest") ?? "").trim(),
        income: Number(form.get("income") ?? 0),
        fgts: Number(form.get("fgts") ?? 0),
        notes: String(form.get("notes") ?? "").trim(),
        nextContactAt: String(form.get("nextContactAt") ?? "") || null,
      });
      setMessage("Dados do lead atualizados.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Não foi possível salvar."); } finally { setBusy(false); }
  }

  async function removeLead() {
    if (!canDelete) return;
    const confirmed = window.confirm(`Excluir definitivamente o lead "${lead.name}"? Esta ação não pode ser desfeita.`);
    if (!confirmed) return;

    setBusy(true);
    setMessage("");
    try {
      await deleteLead(lead.id);
      onDeleted?.(lead.name);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível excluir o lead.");
    } finally {
      setBusy(false);
    }
  }

  async function sendWhatsapp() {
    setBusy(true); setMessage("");
    try {
      await sendWhatsappFromCrm({ leadId: lead.id, phone: lead.phone, message: whatsappMessage });
      setMessage("Mensagem enviada pelo WhatsApp Cloud API e registrada no histórico.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível enviar pelo CRM.");
    } finally { setBusy(false); }
  }

  async function addActivity(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true);
    try {
      const form = new FormData(event.currentTarget);
      await addLeadActivity(lead.id, {
        type: String(form.get("type") ?? "note") as LeadActivityRecord["type"],
        title: String(form.get("title") ?? "").trim(),
        description: String(form.get("description") ?? "").trim(),
        dueAt: String(form.get("dueAt") ?? "") || null,
        completed: false,
      });
      event.currentTarget.reset(); setMessage("Atividade registrada.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Não foi possível registrar."); } finally { setBusy(false); }
  }

  return <div className="fixed inset-0 z-[120] bg-slate-950/50" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <aside className="ml-auto h-full w-full max-w-3xl overflow-y-auto bg-slate-50 shadow-2xl">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-6 py-5"><div><p className="text-xs font-bold uppercase text-blue-800">Perfil do lead</p><h2 className="text-2xl font-extrabold text-slate-950">{lead.name}</h2></div><div className="flex items-center gap-2">{canDelete && <button type="button" onClick={removeLead} disabled={busy} className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700 disabled:opacity-40"><Trash2 size={17}/> Excluir lead</button>}<button onClick={onClose} className="rounded-xl bg-slate-100 p-3"><X/></button></div></header>
      <div className="space-y-6 p-6">
        {message && <p className="rounded-xl bg-blue-50 p-4 text-sm text-blue-800">{message}</p>}

        <section className="rounded-2xl bg-gradient-to-br from-blue-950 to-blue-800 p-5 text-white shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4"><div><div className="flex items-center gap-2"><Sparkles size={19}/><h3 className="font-extrabold">Análise Atlas</h3></div><p className="mt-2 text-sm text-blue-100">Prioridade {priorityLabel(assessment.priority).toLowerCase()} · chance estimada de {assessment.probability}%</p></div><div className="rounded-2xl bg-white/10 px-5 py-3 text-center"><p className="text-3xl font-extrabold">{assessment.score}</p><p className="text-[10px] font-bold uppercase text-blue-100">Score</p></div></div>
          <div className="mt-5 rounded-xl bg-white/10 p-4"><div className="flex items-start gap-3"><Target className="mt-0.5 shrink-0" size={18}/><div><p className="text-xs font-bold uppercase text-blue-100">Próxima ação sugerida</p><p className="mt-1 text-sm font-semibold leading-6">{assessment.nextAction}</p></div></div></div>
          {assessment.alerts.length > 0 && <p className="mt-3 text-sm text-amber-200">Atenção: {assessment.alerts.join(" · ")}</p>}
          <textarea value={whatsappMessage} onChange={(event) => setWhatsappMessage(event.target.value)} rows={3} className="mt-4 w-full rounded-xl border border-white/20 bg-white/10 p-3 text-sm text-white placeholder:text-blue-200"/>
          <div className="mt-3 flex flex-wrap gap-2"><button type="button" onClick={sendWhatsapp} disabled={busy || !whatsappMessage.trim()} className="flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-extrabold text-white disabled:opacity-60"><Send size={17}/> Enviar pelo CRM</button><a href={`https://wa.me/55${lead.phone}?text=${encodeURIComponent(whatsappMessage)}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-extrabold text-blue-950"><MessageCircle size={17}/> Abrir no WhatsApp</a></div>
        </section>

        {(["contract", "won"].includes(lead.stage) || sale) && <section className="rounded-2xl bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-2"><ReceiptText className="text-blue-800"/><div><h3 className="font-extrabold">Venda e previsão financeira</h3><p className="text-sm text-slate-500">Nota fiscal, prazo de pagamento e receita prevista.</p></div></div><button onClick={() => setSaleModal(true)} className="flex items-center gap-2 rounded-xl bg-blue-950 px-4 py-2.5 font-bold text-white"><Pencil size={16}/>{sale ? "Editar financeiro" : "Registrar financeiro"}</button></div>
          {sale ? <div className="mt-5 grid gap-3 sm:grid-cols-2"><Info label="Comissão prevista" value={money(predicted || sale.commissionValue)}/><Info label="Recebido" value={money(received)}/><Info label="Previsão da nota" value={sale.invoiceExpectedAt ? new Date(`${sale.invoiceExpectedAt}T12:00:00`).toLocaleDateString("pt-BR") : "Não informada"}/><Info label="Nota fiscal" value={sale.invoiceNumber || "Ainda não emitida"}/></div> : <p className="mt-4 rounded-xl bg-amber-50 p-4 text-sm text-amber-800">Esta venda ainda não possui previsão de nota fiscal e recebimento cadastrada.</p>}
        </section>}

        <form onSubmit={saveProfile} className="rounded-2xl bg-white p-5 shadow-sm"><h3 className="font-extrabold">Dados e qualificação</h3><div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field name="name" label="Nome" value={lead.name}/><Field name="phone" label="WhatsApp" value={lead.phone}/><Field name="email" label="E-mail" value={lead.email}/><Field name="city" label="Cidade" value={lead.city}/><Field name="propertyInterest" label="Interesse" value={lead.propertyInterest}/><Field name="income" label="Renda familiar" value={lead.income || ""} type="number"/><Field name="fgts" label="FGTS" value={lead.fgts || ""} type="number"/><Field name="nextContactAt" label="Próximo retorno" value={lead.nextContactAt?.slice(0,16) ?? ""} type="datetime-local"/>
        </div><label className="mt-4 block"><span className="mb-1 block text-sm font-semibold">Observações</span><textarea name="notes" defaultValue={lead.notes} rows={4} className="w-full rounded-xl border border-slate-200 p-4"/></label><div className="mt-4 flex justify-end"><button disabled={busy} className="rounded-xl bg-blue-950 px-5 py-3 font-bold text-white">Salvar perfil</button></div></form>

        <form onSubmit={addActivity} className="rounded-2xl bg-white p-5 shadow-sm"><div className="flex items-center gap-2"><ClipboardList className="text-blue-800"/><h3 className="font-extrabold">Nova atividade</h3></div><div className="mt-4 grid gap-4 sm:grid-cols-2"><label><span className="mb-1 block text-sm font-semibold">Tipo</span><select name="type" className="h-12 w-full rounded-xl border border-slate-200 px-4"><option value="note">Observação</option><option value="call">Ligação</option><option value="whatsapp">WhatsApp</option><option value="visit">Visita</option><option value="document">Documento</option><option value="task">Tarefa</option></select></label><Field name="dueAt" label="Prazo/agenda" value="" type="datetime-local"/><Field name="title" label="Título" value=""/><Field name="description" label="Descrição" value=""/></div><div className="mt-4 flex justify-end"><button disabled={busy} className="rounded-xl bg-emerald-600 px-5 py-3 font-bold text-white">Adicionar atividade</button></div></form>

        <section className="rounded-2xl bg-white p-5 shadow-sm"><div className="flex items-center gap-2"><CalendarClock className="text-blue-800"/><h3 className="font-extrabold">Histórico e agenda</h3></div><div className="mt-4 space-y-3">{activities.map((activity) => <article key={activity.id} className="flex gap-3 rounded-xl border border-slate-100 p-4"><button onClick={() => toggleLeadActivity(lead.id, activity.id, !activity.completed)} className={activity.completed ? "text-emerald-600" : "text-slate-300"}><CheckCircle2/></button><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center justify-between gap-2"><p className={`font-bold ${activity.completed ? "line-through text-slate-400" : "text-slate-900"}`}>{activity.title}</p><span className="text-xs uppercase text-slate-400">{activity.type}</span></div><p className="mt-1 text-sm text-slate-500">{activity.description || "Sem descrição"}</p><p className="mt-2 text-xs text-slate-400">{activity.dueAt ? `Prazo: ${new Date(activity.dueAt).toLocaleString("pt-BR")}` : activity.createdAt ? new Date(activity.createdAt).toLocaleString("pt-BR") : ""}</p></div></article>)}{activities.length === 0 && <p className="py-8 text-center text-sm text-slate-400">Nenhuma atividade registrada.</p>}</div></section>
      </div>
    </aside>
    {saleModal && <SaleFormModal sale={sale} defaultLead={lead} leads={[lead]} brokers={brokers} onClose={() => setSaleModal(false)} onSaved={() => setMessage("Venda e previsão financeira salvas.")}/>} 
  </div>;
}

function Field({ name, label, value, type = "text" }: { name: string; label: string; value: string | number; type?: string }) { return <label><span className="mb-1 block text-sm font-semibold">{label}</span><input name={name} type={type} defaultValue={value} className="h-12 w-full rounded-xl border border-slate-200 px-4"/></label>; }
function Info({ label, value }: { label: string; value: string }) { return <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-semibold text-slate-500">{label}</p><p className="mt-1 font-extrabold text-slate-900">{value}</p></div>; }
