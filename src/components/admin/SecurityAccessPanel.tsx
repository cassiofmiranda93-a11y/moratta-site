"use client";

import { useEffect, useState } from "react";
import { KeyRound, RefreshCw, Save, ShieldAlert, ShieldCheck } from "lucide-react";
import { saveSecuritySettings, subscribeToSecuritySettings, syncMemberAccessRecords } from "@/services/adminService";
import type { SecuritySettings } from "@/types/admin";

const DEFAULTS: SecuritySettings = { strictAccess: false, auditRetentionDays: 365, requireRegisteredMember: true };

export default function SecurityAccessPanel() {
  const [settings, setSettings] = useState(DEFAULTS);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => subscribeToSecuritySettings(setSettings, (error) => setMessage(error.message)), []);

  async function sync() {
    setBusy(true);
    try { const count = await syncMemberAccessRecords(); setMessage(`${count} acesso(s) sincronizado(s) com os e-mails da equipe.`); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Não foi possível sincronizar."); }
    finally { setBusy(false); }
  }

  async function save() {
    if (settings.strictAccess && !window.confirm("Confirma a proteção rígida? Contas que não estiverem cadastradas na equipe perderão o acesso ao CRM.")) return;
    setBusy(true);
    try { await saveSecuritySettings(settings); setMessage("Configurações de segurança salvas."); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Não foi possível salvar."); }
    finally { setBusy(false); }
  }

  return <section>
    <div><p className="flex items-center gap-2 text-sm font-bold text-blue-800"><ShieldCheck size={17}/> SEGURANÇA</p><h1 className="text-3xl font-extrabold text-slate-950">Acessos e permissões</h1><p className="mt-2 text-slate-500">Ative a proteção por função somente depois de sincronizar todos os integrantes da equipe.</p></div>
    {message && <p className="mt-4 rounded-xl bg-blue-50 p-4 text-sm text-blue-800">{message}</p>}
    <div className="mt-7 grid gap-6 xl:grid-cols-2">
      <section className="rounded-2xl bg-white p-6 shadow-sm"><div className="flex items-center gap-3"><span className="rounded-xl bg-blue-50 p-3 text-blue-900"><KeyRound/></span><h2 className="text-xl font-extrabold">Sincronização de acessos</h2></div><p className="mt-4 text-sm leading-6 text-slate-500">Cria o mapa de acesso usando o e-mail de cada integrante. O e-mail deve ser o mesmo utilizado no login Google.</p><button onClick={sync} disabled={busy} className="mt-5 flex items-center gap-2 rounded-xl border border-blue-950 px-5 py-3 font-bold text-blue-950 disabled:opacity-60"><RefreshCw size={18}/> Sincronizar equipe</button></section>
      <section className="rounded-2xl bg-white p-6 shadow-sm"><div className="flex items-center gap-3"><span className={`rounded-xl p-3 ${settings.strictAccess ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>{settings.strictAccess ? <ShieldCheck/> : <ShieldAlert/>}</span><h2 className="text-xl font-extrabold">Proteção rígida do Firestore</h2></div><label className="mt-5 flex items-center justify-between gap-4 rounded-xl border border-slate-200 p-4"><div><p className="font-bold text-slate-800">Exigir usuário cadastrado</p><p className="mt-1 text-xs text-slate-500">Aplica as funções Administrador, Gerente, Corretor e Financeiro nas regras do banco.</p></div><input type="checkbox" checked={settings.strictAccess} onChange={(event) => setSettings({ ...settings, strictAccess: event.target.checked })} className="h-5 w-5"/></label><label className="mt-4 block"><span className="mb-1 block text-sm font-semibold">Retenção do histórico de auditoria (dias)</span><input type="number" min={30} max={3650} value={settings.auditRetentionDays} onChange={(event) => setSettings({ ...settings, auditRetentionDays: Number(event.target.value) })} className="h-12 w-full rounded-xl border border-slate-200 px-4"/></label><button onClick={save} disabled={busy} className="mt-5 flex items-center gap-2 rounded-xl bg-blue-950 px-5 py-3 font-bold text-white disabled:opacity-60"><Save size={18}/> Salvar segurança</button></section>
    </div>
    <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-900"><strong>Ordem segura:</strong> cadastre todos os integrantes com o e-mail correto, clique em “Sincronizar equipe”, publique as novas regras do Firestore e só então ative a proteção rígida.</div>
  </section>;
}
