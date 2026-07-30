"use client";

import { FormEvent, useState } from "react";
import { Save, UserPlus, X } from "lucide-react";
import { createLead } from "@/services/adminService";
import type { BrokerRecord } from "@/types/admin";

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
  ["lost", "Perdido"],
] as const;

export default function ManualLeadModal({ brokers, onClose, onSaved, defaultAssignedTo = "", lockAssignedTo = false }: { brokers: BrokerRecord[]; onClose: () => void; onSaved: (message: string) => void; defaultAssignedTo?: string; lockAssignedTo?: boolean }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const form = new FormData(event.currentTarget);
      await createLead({
        name: String(form.get("name") ?? "").trim(),
        phone: String(form.get("phone") ?? "").replace(/\D/g, ""),
        email: String(form.get("email") ?? "").trim().toLowerCase(),
        city: String(form.get("city") ?? "").trim(),
        propertyInterest: String(form.get("propertyInterest") ?? "").trim(),
        developmentId: "",
        propertyId: "",
        assignedTo: String(form.get("assignedTo") ?? ""),
        stage: String(form.get("stage") ?? "new"),
        source: String(form.get("source") ?? "manual"),
        campaign: String(form.get("campaign") ?? "").trim(),
        utmSource: "",
        income: Number(form.get("income") ?? 0),
        fgts: Number(form.get("fgts") ?? 0),
        notes: String(form.get("notes") ?? "").trim(),
        nextContactAt: String(form.get("nextContactAt") ?? "") || null,
        lastContactAt: null,
      });
      onSaved("Cliente cadastrado com sucesso.");
      onClose();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Não foi possível cadastrar o cliente.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[130] overflow-y-auto bg-slate-950/60 p-4">
      <form onSubmit={submit} className="mx-auto my-6 w-full max-w-3xl rounded-3xl bg-white shadow-2xl">
        <header className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
          <div className="flex items-center gap-3"><span className="rounded-xl bg-blue-50 p-3 text-blue-900"><UserPlus/></span><div><p className="text-xs font-bold uppercase text-blue-800">Cadastro rápido</p><h2 className="text-2xl font-extrabold text-slate-950">Novo cliente</h2></div></div>
          <button type="button" onClick={onClose} className="rounded-xl bg-slate-100 p-3"><X/></button>
        </header>
        <div className="p-6">
          {error && <p className="mb-5 rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field name="name" label="Nome completo" required/>
            <Field name="phone" label="WhatsApp com DDD" required placeholder="51999999999"/>
            <Field name="email" label="E-mail" type="email"/>
            <Field name="city" label="Cidade"/>
            <Field name="propertyInterest" label="Empreendimento ou imóvel de interesse"/>
            <Field name="campaign" label="Campanha ou indicação"/>
            <Field name="income" label="Renda familiar mensal" type="number" step="0.01"/>
            <Field name="fgts" label="FGTS disponível" type="number" step="0.01"/>
            <label><span className="mb-1 block text-sm font-semibold">Etapa atual</span><select name="stage" defaultValue="new" className="h-12 w-full rounded-xl border border-slate-200 px-4">{STAGES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
            <label><span className="mb-1 block text-sm font-semibold">Origem</span><select name="source" defaultValue="manual" className="h-12 w-full rounded-xl border border-slate-200 px-4"><option value="manual">Cadastro manual</option><option value="carteira_antiga">Carteira antiga</option><option value="indicacao">Indicação</option><option value="whatsapp">WhatsApp</option><option value="plantao">Plantão</option><option value="construtora">Construtora</option><option value="outro">Outro</option></select></label>
            <label><span className="mb-1 block text-sm font-semibold">Corretor responsável</span>{lockAssignedTo && <input type="hidden" name="assignedTo" value={defaultAssignedTo}/>}<select name={lockAssignedTo ? undefined : "assignedTo"} defaultValue={defaultAssignedTo} disabled={lockAssignedTo} className="h-12 w-full rounded-xl border border-slate-200 px-4 disabled:bg-slate-50"><option value="">Sem responsável</option>{brokers.filter((broker) => broker.active).map((broker) => <option key={broker.id} value={broker.id}>{broker.name}</option>)}</select></label>
            <Field name="nextContactAt" label="Próximo retorno" type="datetime-local"/>
          </div>
          <label className="mt-4 block"><span className="mb-1 block text-sm font-semibold">Observações</span><textarea name="notes" rows={4} className="w-full rounded-xl border border-slate-200 p-4"/></label>
          <div className="mt-6 flex justify-end gap-3"><button type="button" onClick={onClose} className="rounded-xl border border-slate-200 px-5 py-3 font-bold text-slate-700">Cancelar</button><button disabled={busy} className="flex items-center gap-2 rounded-xl bg-blue-950 px-5 py-3 font-bold text-white disabled:opacity-60"><Save size={18}/>{busy ? "Salvando..." : "Cadastrar cliente"}</button></div>
        </div>
      </form>
    </div>
  );
}

function Field({ name, label, required = false, type = "text", placeholder, step }: { name: string; label: string; required?: boolean; type?: string; placeholder?: string; step?: string }) {
  return <label><span className="mb-1 block text-sm font-semibold">{label}</span><input name={name} required={required} type={type} placeholder={placeholder} step={step} className="h-12 w-full rounded-xl border border-slate-200 px-4"/></label>;
}
