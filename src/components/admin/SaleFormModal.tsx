"use client";

import { useMemo, useState } from "react";
import { Plus, Save, Trash2, X } from "lucide-react";
import { saveSale } from "@/services/adminService";
import type { BrokerRecord, SaleInput, SaleInstallmentRecord, SaleRecord, WebsiteLeadRecord } from "@/types/admin";

const SALE_STATUSES: Array<[SaleRecord["status"], string]> = [
  ["confirmed", "Venda confirmada"],
  ["awaiting_documents", "Aguardando documentação"],
  ["awaiting_invoice", "Aguardando emissão da nota"],
  ["invoice_issued", "Nota fiscal emitida"],
  ["payment_scheduled", "Pagamento programado"],
  ["partially_received", "Recebido parcialmente"],
  ["received", "Recebido"],
  ["overdue", "Pagamento atrasado"],
  ["cancelled", "Cancelado"],
];

const INSTALLMENT_STATUSES: Array<[SaleInstallmentRecord["status"], string]> = [
  ["pending", "Pendente"],
  ["scheduled", "Programado"],
  ["partial", "Recebido parcialmente"],
  ["received", "Recebido"],
  ["overdue", "Atrasado"],
  ["cancelled", "Cancelado"],
];

function newId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `parcela-${Date.now()}-${Math.random()}`;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function emptyInstallment(amount = 0): SaleInstallmentRecord {
  return { id: newId(), description: "Parcela 1", amount, expectedAt: "", receivedAt: "", receivedAmount: 0, status: "pending" };
}

function createInitial(sale?: SaleRecord | null, defaultLead?: WebsiteLeadRecord | null): SaleInput {
  if (sale) {
    const { id: _id, createdAt: _createdAt, updatedAt: _updatedAt, ...input } = sale;
    void _id; void _createdAt; void _updatedAt;
    return { ...input, installments: input.installments.length ? input.installments : [emptyInstallment(input.commissionValue)] };
  }
  return {
    leadId: defaultLead?.id ?? "",
    clientName: defaultLead?.name ?? "",
    brokerId: defaultLead?.assignedTo ?? "",
    developmentId: defaultLead?.developmentId ?? "",
    propertyId: defaultLead?.propertyId ?? "",
    saleDate: today(),
    propertyValue: 0,
    commissionPercent: 0,
    commissionValue: 0,
    payerName: "",
    invoiceExpectedAt: "",
    invoiceIssuedAt: "",
    invoiceNumber: "",
    status: "confirmed",
    notes: "",
    installments: [emptyInstallment()],
  };
}

export default function SaleFormModal({ sale, defaultLead, leads, brokers, onClose, onSaved }: {
  sale?: SaleRecord | null;
  defaultLead?: WebsiteLeadRecord | null;
  leads: WebsiteLeadRecord[];
  brokers: BrokerRecord[];
  onClose: () => void;
  onSaved?: () => void;
}) {
  const [form, setForm] = useState<SaleInput>(() => createInitial(sale, defaultLead));
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const expectedTotal = useMemo(() => form.installments.reduce((sum, item) => sum + Number(item.amount || 0), 0), [form.installments]);
  const receivedTotal = useMemo(() => form.installments.reduce((sum, item) => sum + Number(item.receivedAmount || 0), 0), [form.installments]);

  function update<K extends keyof SaleInput>(key: K, value: SaleInput[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function selectLead(leadId: string) {
    const lead = leads.find((item) => item.id === leadId);
    setForm((current) => ({
      ...current,
      leadId,
      clientName: lead?.name ?? current.clientName,
      brokerId: lead?.assignedTo || current.brokerId,
      developmentId: lead?.developmentId || current.developmentId,
      propertyId: lead?.propertyId || current.propertyId,
    }));
  }

  function updateFinancial(propertyValue: number, commissionPercent: number) {
    const commissionValue = Number(((propertyValue * commissionPercent) / 100).toFixed(2));
    setForm((current) => ({
      ...current,
      propertyValue,
      commissionPercent,
      commissionValue,
      installments: current.installments.length === 1 && current.installments[0].receivedAmount === 0
        ? [{ ...current.installments[0], amount: commissionValue }]
        : current.installments,
    }));
  }

  function updateInstallment(id: string, patch: Partial<SaleInstallmentRecord>) {
    setForm((current) => ({ ...current, installments: current.installments.map((item) => item.id === id ? { ...item, ...patch } : item) }));
  }

  function addInstallment() {
    setForm((current) => ({
      ...current,
      installments: [...current.installments, { ...emptyInstallment(), description: `Parcela ${current.installments.length + 1}` }],
    }));
  }

  async function submit() {
    if (!form.leadId || !form.clientName.trim()) return setMessage("Selecione o cliente da venda.");
    if (form.commissionValue <= 0) return setMessage("Informe o valor da comissão prevista.");
    if (form.installments.length === 0) return setMessage("Cadastre ao menos uma previsão de recebimento.");
    setBusy(true);
    setMessage("");
    try {
      await saveSale({ ...form, clientName: form.clientName.trim(), installments: form.installments.map((item) => ({ ...item, amount: Number(item.amount), receivedAmount: Number(item.receivedAmount) })) }, sale?.id);
      onSaved?.();
      onClose();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível salvar a venda.");
    } finally {
      setBusy(false);
    }
  }

  return <div className="fixed inset-0 z-[150] overflow-y-auto bg-slate-950/60 p-4">
    <div className="mx-auto my-5 w-full max-w-5xl rounded-3xl bg-slate-50 shadow-2xl">
      <header className="sticky top-0 z-10 flex items-center justify-between rounded-t-3xl border-b bg-white px-6 py-5">
        <div><p className="text-xs font-bold uppercase text-blue-800">Venda e previsão financeira</p><h2 className="text-2xl font-extrabold text-slate-950">{sale ? "Editar venda" : "Registrar nova venda"}</h2></div>
        <button onClick={onClose} className="rounded-xl bg-slate-100 p-3" aria-label="Fechar"><X/></button>
      </header>
      <div className="space-y-6 p-6">
        {message && <p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-800">{message}</p>}
        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <h3 className="font-extrabold text-slate-900">Dados da venda</h3>
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <SelectField label="Cliente" value={form.leadId} onChange={selectLead} options={leads.map((lead) => [lead.id, lead.name])}/>
            <Field label="Nome do cliente" value={form.clientName} onChange={(value) => update("clientName", value)}/>
            <SelectField label="Corretor" value={form.brokerId} onChange={(value) => update("brokerId", value)} options={brokers.map((broker) => [broker.id, broker.name])} emptyLabel="Não informado"/>
            <Field label="Empreendimento" value={form.developmentId} onChange={(value) => update("developmentId", value)}/>
            <Field label="Unidade/imóvel" value={form.propertyId} onChange={(value) => update("propertyId", value)}/>
            <Field label="Data da venda" value={form.saleDate} onChange={(value) => update("saleDate", value)} type="date"/>
            <NumberField label="Valor do imóvel" value={form.propertyValue} onChange={(value) => updateFinancial(value, form.commissionPercent)}/>
            <NumberField label="Comissão (%)" value={form.commissionPercent} onChange={(value) => updateFinancial(form.propertyValue, value)} step="0.01"/>
            <NumberField label="Comissão prevista" value={form.commissionValue} onChange={(value) => update("commissionValue", value)}/>
            <Field label="Empresa pagadora" value={form.payerName} onChange={(value) => update("payerName", value)} placeholder="Construtora ou parceiro"/>
            <SelectField label="Status financeiro" value={form.status} onChange={(value) => update("status", value as SaleRecord["status"])} options={SALE_STATUSES}/>
          </div>
        </section>

        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <h3 className="font-extrabold text-slate-900">Nota fiscal</h3>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <Field label="Previsão de emissão" value={form.invoiceExpectedAt} onChange={(value) => update("invoiceExpectedAt", value)} type="date"/>
            <Field label="Data real da emissão" value={form.invoiceIssuedAt} onChange={(value) => update("invoiceIssuedAt", value)} type="date"/>
            <Field label="Número da nota fiscal" value={form.invoiceNumber} onChange={(value) => update("invoiceNumber", value)}/>
          </div>
        </section>

        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="font-extrabold text-slate-900">Previsão de recebimentos</h3><p className="mt-1 text-sm text-slate-500">Cadastre uma ou mais parcelas para projetar o fluxo de caixa.</p></div><button onClick={addInstallment} type="button" className="flex items-center gap-2 rounded-xl bg-blue-50 px-4 py-2.5 font-bold text-blue-800"><Plus size={17}/> Adicionar parcela</button></div>
          <div className="mt-5 space-y-4">{form.installments.map((item, index) => <div key={item.id} className="rounded-2xl border border-slate-200 p-4">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
              <Field label="Descrição" value={item.description} onChange={(value) => updateInstallment(item.id, { description: value })}/>
              <NumberField label="Valor previsto" value={item.amount} onChange={(value) => updateInstallment(item.id, { amount: value })}/>
              <Field label="Data prevista" value={item.expectedAt} onChange={(value) => updateInstallment(item.id, { expectedAt: value })} type="date"/>
              <NumberField label="Valor recebido" value={item.receivedAmount} onChange={(value) => updateInstallment(item.id, { receivedAmount: value })}/>
              <Field label="Data recebida" value={item.receivedAt} onChange={(value) => updateInstallment(item.id, { receivedAt: value })} type="date"/>
              <div className="flex items-end gap-2"><div className="flex-1"><SelectField label="Status" value={item.status} onChange={(value) => updateInstallment(item.id, { status: value as SaleInstallmentRecord["status"] })} options={INSTALLMENT_STATUSES}/></div><button type="button" disabled={form.installments.length === 1} onClick={() => update("installments", form.installments.filter((installment) => installment.id !== item.id))} className="mb-0.5 rounded-xl bg-red-50 p-3 text-red-700 disabled:opacity-30" aria-label={`Excluir parcela ${index + 1}`}><Trash2 size={17}/></button></div>
            </div>
          </div>)}</div>
          <div className="mt-5 grid gap-3 sm:grid-cols-3"><Summary label="Comissão cadastrada" value={form.commissionValue}/><Summary label="Parcelas previstas" value={expectedTotal}/><Summary label="Total recebido" value={receivedTotal}/></div>
        </section>

        <section className="rounded-2xl bg-white p-5 shadow-sm"><label><span className="mb-1 block text-sm font-semibold">Observações financeiras</span><textarea value={form.notes} onChange={(event) => update("notes", event.target.value)} rows={4} className="w-full rounded-xl border border-slate-200 p-4"/></label></section>
        <div className="flex justify-end gap-3"><button onClick={onClose} className="rounded-xl border border-slate-200 bg-white px-5 py-3 font-bold">Cancelar</button><button onClick={submit} disabled={busy} className="flex items-center gap-2 rounded-xl bg-blue-950 px-6 py-3 font-bold text-white disabled:opacity-60"><Save size={18}/>{busy ? "Salvando..." : "Salvar venda"}</button></div>
      </div>
    </div>
  </div>;
}

function Field({ label, value, onChange, type = "text", placeholder }: { label: string; value: string; onChange: (value: string) => void; type?: string; placeholder?: string }) {
  return <label><span className="mb-1 block text-sm font-semibold text-slate-700">{label}</span><input type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="h-12 w-full rounded-xl border border-slate-200 px-4"/></label>;
}
function NumberField({ label, value, onChange, step = "0.01" }: { label: string; value: number; onChange: (value: number) => void; step?: string }) {
  return <label><span className="mb-1 block text-sm font-semibold text-slate-700">{label}</span><input type="number" min="0" step={step} value={value} onChange={(event) => onChange(Number(event.target.value || 0))} className="h-12 w-full rounded-xl border border-slate-200 px-4"/></label>;
}
function SelectField({ label, value, onChange, options, emptyLabel }: { label: string; value: string; onChange: (value: string) => void; options: ReadonlyArray<readonly [string, string]>; emptyLabel?: string }) {
  return <label><span className="mb-1 block text-sm font-semibold text-slate-700">{label}</span><select value={value} onChange={(event) => onChange(event.target.value)} className="h-12 w-full rounded-xl border border-slate-200 px-4">{emptyLabel !== undefined && <option value="">{emptyLabel}</option>}{options.map(([optionValue, optionLabel]) => <option key={optionValue} value={optionValue}>{optionLabel}</option>)}</select></label>;
}
function Summary({ label, value }: { label: string; value: number }) { return <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-semibold text-slate-500">{label}</p><p className="mt-1 text-xl font-extrabold text-slate-900">{value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p></div>; }
