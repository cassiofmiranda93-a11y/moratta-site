"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { CheckCircle2, Copy, MessageCircle, Network, RefreshCw, Save, Settings2, Share2, XCircle } from "lucide-react";
import { getIntegrationRuntimeStatus } from "@/services/integrationService";
import { saveCrmSettings, subscribeToCrmSettings } from "@/services/adminService";
import type { DistributionSettings, IntegrationRuntimeStatus, IntegrationSettings } from "@/types/admin";

const DEFAULT_DISTRIBUTION: DistributionSettings = { mode: "round_robin", respectAvailability: true, respectDailyLimit: true, useCityMatching: false, useSpecialtyMatching: false };
const DEFAULT_INTEGRATIONS: IntegrationSettings = { metaEnabled: false, metaPageId: "", metaFormIds: [], autoDistributeMetaLeads: true, whatsappEnabled: false, whatsappNumber: "", whatsappDefaultMessage: "Olá, {nome}! Aqui é da Moratta Imóveis.", webhookUrl: "" };

export default function IntegrationsPanel() {
  const [distribution, setDistribution] = useState(DEFAULT_DISTRIBUTION);
  const [integrations, setIntegrations] = useState(DEFAULT_INTEGRATIONS);
  const [runtime, setRuntime] = useState<IntegrationRuntimeStatus | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => subscribeToCrmSettings((data) => { setDistribution(data.distribution); setIntegrations(data.integrations); }, (error) => setMessage(error.message)), []);
  useEffect(() => { refreshStatus(); }, []);

  const siteUrl = useMemo(() => typeof window === "undefined" ? "" : window.location.origin, []);
  const metaWebhook = runtime ? `${siteUrl}${runtime.metaWebhookPath}` : "";
  const whatsappWebhook = runtime ? `${siteUrl}${runtime.whatsappWebhookPath}` : "";

  async function refreshStatus() {
    try { setRuntime(await getIntegrationRuntimeStatus()); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Não foi possível verificar o servidor."); }
  }

  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true);
    try { await saveCrmSettings(distribution, integrations); setMessage("Configurações salvas."); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Não foi possível salvar."); }
    finally { setBusy(false); }
  }

  return <form onSubmit={submit}>
    <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-bold text-blue-800">AUTOMAÇÃO</p><h1 className="text-3xl font-extrabold text-slate-950">Distribuição e integrações</h1><p className="mt-2 text-slate-500">Webhooks seguros para Meta Lead Ads e WhatsApp Cloud API, sem expor tokens no navegador.</p></div><button type="button" onClick={refreshStatus} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 font-bold text-slate-700"><RefreshCw size={17}/> Verificar servidor</button></div>
    {message && <p className="mt-4 rounded-xl bg-blue-50 p-4 text-sm text-blue-800">{message}</p>}

    <div className="mt-6 grid gap-3 sm:grid-cols-3">
      <RuntimeStatus label="Firebase Admin" ready={runtime?.firebaseAdminConfigured}/>
      <RuntimeStatus label="Meta Lead Ads" ready={runtime?.metaConfigured}/>
      <RuntimeStatus label="WhatsApp Cloud API" ready={runtime?.whatsappConfigured}/>
    </div>

    <div className="mt-7 grid gap-6 xl:grid-cols-2">
      <Panel icon={<Network/>} title="Distribuição inteligente">
        <label className="block"><span className="mb-1 block text-sm font-semibold">Modo principal</span><select value={distribution.mode} onChange={(e) => setDistribution({ ...distribution, mode: e.target.value as DistributionSettings["mode"] })} className="h-12 w-full rounded-xl border border-slate-200 px-4"><option value="round_robin">Round robin</option><option value="balanced">Menor carteira</option></select></label>
        <Toggle checked={distribution.respectAvailability} onChange={(value) => setDistribution({ ...distribution, respectAvailability: value })} label="Distribuir apenas para corretores disponíveis"/>
        <Toggle checked={distribution.respectDailyLimit} onChange={(value) => setDistribution({ ...distribution, respectDailyLimit: value })} label="Respeitar limite diário de leads"/>
        <Toggle checked={distribution.useCityMatching} onChange={(value) => setDistribution({ ...distribution, useCityMatching: value })} label="Priorizar corretor por cidade"/>
        <Toggle checked={distribution.useSpecialtyMatching} onChange={(value) => setDistribution({ ...distribution, useSpecialtyMatching: value })} label="Priorizar por empreendimento/especialidade"/>
      </Panel>

      <Panel icon={<Share2/>} title="Meta Lead Ads">
        <Toggle checked={integrations.metaEnabled} onChange={(value) => setIntegrations({ ...integrations, metaEnabled: value })} label="Ativar recebimento de leads da Meta"/>
        <Toggle checked={integrations.autoDistributeMetaLeads} onChange={(value) => setIntegrations({ ...integrations, autoDistributeMetaLeads: value })} label="Distribuir automaticamente os leads recebidos"/>
        <Field label="ID da Página Meta" value={integrations.metaPageId} onChange={(value) => setIntegrations({ ...integrations, metaPageId: value })}/>
        <Field label="IDs dos formulários, separados por vírgula" value={integrations.metaFormIds.join(", ")} onChange={(value) => setIntegrations({ ...integrations, metaFormIds: value.split(",").map((item) => item.trim()).filter(Boolean) })}/>
        <CopyField label="Webhook para cadastrar na Meta" value={metaWebhook}/>
        <SecretList items={["META_APP_SECRET", "META_PAGE_ACCESS_TOKEN", "META_WEBHOOK_VERIFY_TOKEN", "META_GRAPH_API_VERSION"]}/>
      </Panel>

      <Panel icon={<MessageCircle/>} title="WhatsApp Cloud API">
        <Toggle checked={integrations.whatsappEnabled} onChange={(value) => setIntegrations({ ...integrations, whatsappEnabled: value })} label="Ativar envio de mensagens pelo CRM"/>
        <Field label="Número oficial" value={integrations.whatsappNumber} onChange={(value) => setIntegrations({ ...integrations, whatsappNumber: value.replace(/\D/g, "") })} placeholder="5551999999999"/>
        <label className="block"><span className="mb-1 block text-sm font-semibold">Mensagem padrão</span><textarea value={integrations.whatsappDefaultMessage} onChange={(event) => setIntegrations({ ...integrations, whatsappDefaultMessage: event.target.value })} rows={4} className="w-full rounded-xl border border-slate-200 p-4"/><span className="mt-1 block text-xs text-slate-400">Use {'{nome}'} para inserir o nome do cliente.</span></label>
        <CopyField label="Webhook para cadastrar no WhatsApp" value={whatsappWebhook}/>
        <SecretList items={["WHATSAPP_APP_SECRET", "WHATSAPP_ACCESS_TOKEN", "WHATSAPP_PHONE_NUMBER_ID", "WHATSAPP_WEBHOOK_VERIFY_TOKEN", "WHATSAPP_GRAPH_API_VERSION"]}/>
      </Panel>

      <Panel icon={<Settings2/>} title="Checklist de produção">
        <Checklist ready={Boolean(runtime?.firebaseAdminConfigured)} text="Credenciais Firebase Admin na Vercel"/>
        <Checklist ready={Boolean(runtime?.metaConfigured)} text="Segredos e versão da Graph API para Meta"/>
        <Checklist ready={Boolean(runtime?.whatsappConfigured)} text="Credenciais da WhatsApp Cloud API"/>
        <Checklist ready={Boolean(integrations.metaPageId)} text="Página Meta identificada no CRM"/>
        <Checklist ready={integrations.metaEnabled || integrations.whatsappEnabled} text="Ao menos uma integração ativada"/>
        <p className="rounded-xl bg-amber-50 p-3 text-xs leading-5 text-amber-800">Os tokens devem ser cadastrados somente nas variáveis do servidor/Vercel. Não adicione segredos em arquivos NEXT_PUBLIC_*.</p>
      </Panel>
    </div>
    <div className="sticky bottom-4 mt-6 flex justify-end"><button disabled={busy} className="flex items-center gap-2 rounded-xl bg-blue-950 px-6 py-3 font-bold text-white shadow-lg disabled:opacity-60"><Save size={18}/>{busy ? "Salvando..." : "Salvar configurações"}</button></div>
  </form>;
}

function RuntimeStatus({ label, ready }: { label: string; ready?: boolean }) { return <div className={`flex items-center gap-3 rounded-xl border p-4 ${ready ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-slate-200 bg-white text-slate-500"}`}>{ready ? <CheckCircle2/> : <XCircle/>}<div><p className="text-xs font-bold uppercase">{ready ? "Configurado" : "Pendente"}</p><p className="font-extrabold">{label}</p></div></div>; }
function Panel({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) { return <section className="rounded-2xl bg-white p-6 shadow-sm"><div className="flex items-center gap-3"><span className="rounded-xl bg-blue-50 p-3 text-blue-900">{icon}</span><h2 className="text-xl font-extrabold">{title}</h2></div><div className="mt-5 space-y-4">{children}</div></section>; }
function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (value: boolean) => void; label: string }) { return <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-slate-100 p-3"><span className="text-sm font-semibold text-slate-700">{label}</span><input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-5 w-5"/></label>; }
function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string }) { return <label className="block"><span className="mb-1 block text-sm font-semibold">{label}</span><input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="h-12 w-full rounded-xl border border-slate-200 px-4"/></label>; }
function CopyField({ label, value }: { label: string; value: string }) { return <div><span className="mb-1 block text-sm font-semibold">{label}</span><div className="flex gap-2"><input value={value} readOnly className="h-12 min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm"/><button type="button" onClick={() => navigator.clipboard.writeText(value)} disabled={!value} className="rounded-xl bg-slate-100 px-4 text-slate-700 disabled:opacity-50" aria-label="Copiar"><Copy size={17}/></button></div></div>; }
function SecretList({ items }: { items: string[] }) { return <div className="rounded-xl bg-slate-950 p-4 text-xs text-slate-100"><p className="mb-2 font-bold text-slate-300">Variáveis secretas necessárias</p>{items.map((item) => <code key={item} className="block py-0.5">{item}=</code>)}</div>; }
function Checklist({ text, ready }: { text: string; ready: boolean }) { return <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3 text-sm font-semibold text-slate-700">{ready ? <CheckCircle2 className="text-emerald-600" size={18}/> : <XCircle className="text-slate-300" size={18}/>} {text}</div>; }
