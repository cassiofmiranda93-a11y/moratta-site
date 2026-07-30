"use client";

import { FormEvent, useEffect, useState } from "react";
import { Pencil, Plus, RefreshCw, Trash2, UserRound } from "lucide-react";
import { deleteBroker, saveBroker, subscribeToBrokers, syncMemberAccessRecords, toggleBroker } from "@/services/adminService";
import type { BrokerRecord, UserRole } from "@/types/admin";

const EMPTY_FORM = {
  name: "",
  email: "",
  phone: "",
  creci: "",
  active: true,
  available: true,
  specialties: [] as string[],
  cities: [] as string[],
  dailyLeadLimit: 20,
  monthlyGoal: 0,
  commissionRate: 0,
  role: "broker" as UserRole,
};

const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Administrador",
  manager: "Gerente",
  broker: "Corretor",
  finance: "Financeiro",
};

export default function TeamPanel({ currentUserRole = "admin" }: { currentUserRole?: UserRole }) {
  const [brokers, setBrokers] = useState<BrokerRecord[]>([]);
  const [editing, setEditing] = useState<BrokerRecord | null | undefined>(undefined);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => subscribeToBrokers(setBrokers, (error) => setMessage(error.message)), []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const form = new FormData(event.currentTarget);
      const input = {
        name: String(form.get("name") ?? "").trim(),
        email: String(form.get("email") ?? "").trim().toLowerCase(),
        phone: String(form.get("phone") ?? "").replace(/\D/g, ""),
        creci: String(form.get("creci") ?? "").trim(),
        role: String(form.get("role") ?? "broker") as UserRole,
        active: form.get("active") === "on",
        available: form.get("available") === "on",
        specialties: String(form.get("specialties") ?? "").split(",").map((value) => value.trim()).filter(Boolean),
        cities: String(form.get("cities") ?? "").split(",").map((value) => value.trim()).filter(Boolean),
        dailyLeadLimit: Number(form.get("dailyLeadLimit") ?? 20),
        monthlyGoal: Number(form.get("monthlyGoal") ?? 0),
        commissionRate: Number(form.get("commissionRate") ?? 0),
      };
      const duplicate = brokers.find((item) => item.id !== editing?.id && input.email && item.email.toLowerCase() === input.email);
      if (duplicate) throw new Error("Já existe um integrante cadastrado com este e-mail.");
      await saveBroker(input, editing?.id);
      setEditing(undefined);
      setMessage(editing ? "Integrante atualizado." : "Integrante cadastrado.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível salvar o integrante.");
    } finally {
      setBusy(false);
    }
  }

  async function handleSyncAccess() {
    setBusy(true);
    try {
      const count = await syncMemberAccessRecords();
      setMessage(`${count} acesso(s) sincronizado(s) com os e-mails da equipe.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível sincronizar os acessos.");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(broker: BrokerRecord) {
    if (!window.confirm(`Excluir ${broker.name}? Os leads dele ficarão sem responsável.`)) return;
    setBusy(true);
    try {
      await deleteBroker(broker.id);
      setMessage("Integrante excluído e leads liberados para nova distribuição.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível excluir.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-blue-800">EQUIPE E ACESSOS</p>
          <h1 className="text-3xl font-extrabold text-slate-950">Integrantes da Moratta</h1>
          <p className="mt-2 text-slate-500">Gerencie corretores, funções e participação na roleta de leads.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={handleSyncAccess} disabled={busy} className="flex items-center gap-2 rounded-xl border border-blue-950 px-5 py-3 font-bold text-blue-950 disabled:opacity-60"><RefreshCw size={18}/> Sincronizar acessos</button>
          <button onClick={() => setEditing(null)} className="flex items-center gap-2 rounded-xl bg-blue-950 px-5 py-3 font-bold text-white">
            <Plus size={18}/> Novo integrante
          </button>
        </div>
      </div>

      {message && <p className="mt-4 rounded-xl bg-blue-50 p-4 text-sm text-blue-800">{message}</p>}

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {brokers.map((broker) => {
          const canEditBroker = currentUserRole === "admin" || broker.role !== "admin";
          return <article key={broker.id} className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-blue-50 p-3 text-blue-900"><UserRound/></div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="truncate font-extrabold text-slate-900">{broker.name}</h2>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold uppercase text-slate-600">{ROLE_LABELS[broker.role]}</span>
                </div>
                <p className="truncate text-sm text-slate-500">{broker.email || broker.phone}</p>
                <p className="mt-1 text-xs text-slate-400">{broker.creci || "CRECI não informado"}</p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
              <Info label="Limite diário" value={String(broker.dailyLeadLimit || "Sem limite")}/>
              <Info label="Meta mensal" value={broker.monthlyGoal ? `R$ ${broker.monthlyGoal.toLocaleString("pt-BR")}` : "Não definida"}/>
            </div>
            <button disabled={busy || !canEditBroker} onClick={() => toggleBroker(broker.id, !broker.active)} className={`mt-4 w-full rounded-xl px-4 py-2 text-sm font-bold ${broker.active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
              {broker.active ? "Ativo na equipe" : "Acesso inativo"}
            </button>
            <div className="mt-3 flex gap-2">
              <button disabled={!canEditBroker} onClick={() => setEditing(broker)} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-50 px-4 py-2.5 font-bold text-blue-800 disabled:cursor-not-allowed disabled:opacity-40"><Pencil size={16}/> Editar</button>
              <button disabled={!canEditBroker} onClick={() => handleDelete(broker)} className="rounded-xl bg-red-50 p-3 text-red-700 disabled:cursor-not-allowed disabled:opacity-40" aria-label="Excluir"><Trash2 size={16}/></button>
            </div>
          </article>;
        })}
      </div>

      {editing !== undefined && (
        <div className="fixed inset-0 z-[110] grid place-items-center overflow-y-auto bg-slate-950/60 p-4">
          <form onSubmit={handleSubmit} className="my-6 w-full max-w-2xl rounded-3xl bg-white p-7 shadow-2xl">
            <h2 className="text-2xl font-extrabold">{editing ? "Editar integrante" : "Novo integrante"}</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <Field name="name" label="Nome" value={editing?.name ?? EMPTY_FORM.name} required/>
              <Field name="email" label="E-mail de acesso" value={editing?.email ?? EMPTY_FORM.email}/>
              <Field name="phone" label="WhatsApp" value={editing?.phone ?? EMPTY_FORM.phone}/>
              <Field name="creci" label="CRECI" value={editing?.creci ?? EMPTY_FORM.creci}/>
              <label>
                <span className="mb-1 block text-sm font-semibold">Função no sistema</span>
                <select name="role" defaultValue={editing?.role ?? EMPTY_FORM.role} className="h-12 w-full rounded-xl border border-slate-200 px-4">
                  {Object.entries(ROLE_LABELS).filter(([value]) => currentUserRole === "admin" || value !== "admin").map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </label>
              <Field name="dailyLeadLimit" label="Limite diário de leads" value={editing?.dailyLeadLimit ?? EMPTY_FORM.dailyLeadLimit} type="number"/>
              <Field name="monthlyGoal" label="Meta mensal (R$)" value={editing?.monthlyGoal ?? EMPTY_FORM.monthlyGoal} type="number"/>
              <Field name="commissionRate" label="Comissão do corretor (%)" value={editing?.commissionRate ?? EMPTY_FORM.commissionRate} type="number" step="0.01"/>
              <Field name="cities" label="Cidades (separadas por vírgula)" value={(editing?.cities ?? []).join(", ")}/>
              <Field name="specialties" label="Especialidades (separadas por vírgula)" value={(editing?.specialties ?? []).join(", ")}/>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <Check name="active" label="Acesso ativo" checked={editing?.active ?? true}/>
              <Check name="available" label="Disponível para receber leads" checked={editing?.available ?? true}/>
            </div>
            <p className="mt-4 rounded-xl bg-blue-50 p-3 text-xs leading-5 text-blue-800">O e-mail deve ser exatamente o mesmo usado no login Google. Ao salvar, o mapa de acesso do Firestore também será atualizado.</p>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setEditing(undefined)} className="rounded-xl border px-5 py-3 font-bold">Cancelar</button>
              <button disabled={busy} className="rounded-xl bg-blue-950 px-5 py-3 font-bold text-white disabled:opacity-60">{busy ? "Salvando..." : "Salvar"}</button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}

function Field({ name, label, value, type = "text", required = false, step }: { name: string; label: string; value: string | number; type?: string; required?: boolean; step?: string }) {
  return <label><span className="mb-1 block text-sm font-semibold">{label}</span><input name={name} type={type} step={step} defaultValue={value} required={required} className="h-12 w-full rounded-xl border border-slate-200 px-4"/></label>;
}

function Check({ name, label, checked }: { name: string; label: string; checked: boolean }) {
  return <label className="flex items-center justify-between rounded-xl border border-slate-200 p-4"><span className="text-sm font-semibold text-slate-700">{label}</span><input name={name} type="checkbox" defaultChecked={checked} className="h-5 w-5"/></label>;
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl bg-slate-50 p-3"><p className="text-slate-400">{label}</p><p className="mt-1 font-bold text-slate-700">{value}</p></div>;
}
