"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Archive,
  Building2,
  ExternalLink,
  Home,
  LogOut,
  Pencil,
  Plus,
  RefreshCw,
  UploadCloud,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useCatalog } from "@/hooks/useCatalog";
import { PROJECTS } from "@/data/projects";
import { firebaseConfigured, firebaseConfigurationError } from "@/config/firebase";
import { loginWithGoogle, logout } from "@/services/authService";
import { archiveDevelopment, archiveProperty, seedDevelopments } from "@/services/catalogService";
import { formatCurrency } from "@/lib/catalog";
import DevelopmentForm from "./DevelopmentForm";
import PropertyForm from "./PropertyForm";
import type { Development, PropertyUnit } from "@/types/project";

type Tab = "overview" | "developments" | "properties";

export default function AdminDashboard() {
  const { user, loading: authLoading } = useAuth();
  const { developments, properties, loading, error } = useCatalog();
  const [tab, setTab] = useState<Tab>("overview");
  const [developmentForm, setDevelopmentForm] = useState<Development | null | undefined>(undefined);
  const [propertyForm, setPropertyForm] = useState<PropertyUnit | null | undefined>(undefined);
  const [actionMessage, setActionMessage] = useState("");

  const metrics = useMemo(() => ({
    published: developments.filter((item) => item.status === "published" && item.active).length,
    drafts: developments.filter((item) => item.status === "draft").length,
    available: properties.filter((item) => item.status === "available" && item.active).length,
    reserved: properties.filter((item) => item.status === "reserved").length,
  }), [developments, properties]);

  if (!firebaseConfigured) {
    return <SetupMessage />;
  }

  if (authLoading) return <Centered text="Verificando acesso..." />;

  if (!user) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-100 px-6">
        <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-xl">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-blue-950 text-white"><Building2 size={32} /></div>
          <h1 className="mt-6 text-3xl font-extrabold text-slate-950">Administração Moratta</h1>
          <p className="mt-3 leading-7 text-slate-500">Entre com a mesma conta Google usada no Firebase e no Atlas.</p>
          <button onClick={() => loginWithGoogle()} className="mt-7 w-full rounded-xl bg-blue-950 px-5 py-3.5 font-bold text-white transition hover:bg-blue-800">Entrar com Google</button>
          <Link href="/" className="mt-4 inline-block text-sm font-semibold text-slate-500 hover:text-blue-800">Voltar ao site</Link>
        </div>
      </main>
    );
  }

  async function runAction(action: () => Promise<unknown>, success: string) {
    setActionMessage("Processando...");
    try { await action(); setActionMessage(success); }
    catch (nextError) { setActionMessage(nextError instanceof Error ? nextError.message : "Não foi possível concluir."); }
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-4 px-5 py-4">
          <div className="flex items-center gap-3"><div className="rounded-xl bg-blue-950 p-2.5 text-white"><Building2 /></div><div><p className="font-extrabold text-slate-900">Moratta Admin</p><p className="text-xs text-slate-500">Catálogo integrado ao Atlas</p></div></div>
          <div className="flex items-center gap-2">
            <Link href="/" target="_blank" className="hidden items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 sm:flex"><ExternalLink size={16} /> Abrir site</Link>
            <button onClick={() => logout()} className="flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2 text-sm font-bold text-slate-700"><LogOut size={16} /> Sair</button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1500px] gap-6 px-5 py-6 lg:grid-cols-[240px_1fr]">
        <aside className="h-fit rounded-2xl bg-white p-3 shadow-sm lg:sticky lg:top-24">
          <p className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-slate-400">Gestão</p>
          <NavButton active={tab === "overview"} onClick={() => setTab("overview")} icon={<Home size={18} />} label="Visão geral" />
          <NavButton active={tab === "developments"} onClick={() => setTab("developments")} icon={<Building2 size={18} />} label="Empreendimentos" />
          <NavButton active={tab === "properties"} onClick={() => setTab("properties")} icon={<Home size={18} />} label="Imóveis e unidades" />
          <div className="mt-4 border-t border-slate-100 pt-4"><p className="px-3 text-xs text-slate-500">Conectado como</p><p className="mt-1 truncate px-3 text-sm font-semibold text-slate-700">{user.email}</p></div>
        </aside>

        <main>
          {actionMessage && <div className="mb-5 rounded-xl bg-blue-50 p-4 text-sm font-semibold text-blue-800">{actionMessage}</div>}
          {error && <div className="mb-5 rounded-xl bg-amber-50 p-4 text-sm text-amber-800">{error}</div>}
          {loading ? <Centered text="Carregando catálogo..." compact /> : (
            <>
              {tab === "overview" && (
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-sm font-bold text-blue-800">PAINEL DO SITE</p><h1 className="text-3xl font-extrabold text-slate-950">Visão geral do catálogo</h1></div><button onClick={() => runAction(() => seedDevelopments(PROJECTS), "Catálogo inicial importado.")} className="flex items-center gap-2 rounded-xl border border-blue-950 px-4 py-3 font-bold text-blue-950"><UploadCloud size={18} /> Importar catálogo inicial</button></div>
                  <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <Metric label="Publicados" value={metrics.published} note="visíveis no site" />
                    <Metric label="Rascunhos" value={metrics.drafts} note="aguardando publicação" />
                    <Metric label="Disponíveis" value={metrics.available} note="unidades para venda" />
                    <Metric label="Reservados" value={metrics.reserved} note="unidades em negociação" />
                  </div>
                  <div className="mt-7 grid gap-6 xl:grid-cols-2">
                    <section className="rounded-2xl bg-white p-6 shadow-sm"><div className="flex items-center justify-between"><h2 className="text-xl font-extrabold">Últimos empreendimentos</h2><button onClick={() => setTab("developments")} className="text-sm font-bold text-blue-800">Ver todos</button></div><div className="mt-5 space-y-3">{developments.slice(0, 5).map((item) => <CompactDevelopment key={item.id} item={item} />)}{developments.length === 0 && <Empty text="Nenhum empreendimento cadastrado." />}</div></section>
                    <section className="rounded-2xl bg-white p-6 shadow-sm"><div className="flex items-center justify-between"><h2 className="text-xl font-extrabold">Unidades disponíveis</h2><button onClick={() => setTab("properties")} className="text-sm font-bold text-blue-800">Ver todas</button></div><div className="mt-5 space-y-3">{properties.filter((item) => item.status === "available").slice(0, 5).map((item) => <CompactProperty key={item.id} item={item} development={developments.find((development) => development.id === item.developmentId)} />)}{properties.length === 0 && <Empty text="Nenhuma unidade cadastrada." />}</div></section>
                  </div>
                </div>
              )}

              {tab === "developments" && (
                <section>
                  <PageHeader title="Empreendimentos" subtitle="Cadastre uma vez para publicar no site e disponibilizar no Atlas." actionLabel="Novo empreendimento" onAction={() => setDevelopmentForm(null)} />
                  <div className="mt-6 overflow-hidden rounded-2xl bg-white shadow-sm">
                    <div className="overflow-x-auto"><table className="w-full min-w-[850px] text-left"><thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500"><tr><th className="p-4">Empreendimento</th><th className="p-4">Local</th><th className="p-4">Preço</th><th className="p-4">Status</th><th className="p-4">Destaque</th><th className="p-4 text-right">Ações</th></tr></thead><tbody>{developments.map((item) => <tr key={item.id} className="border-t border-slate-100"><td className="p-4"><p className="font-bold text-slate-900">{item.name}</p><p className="text-sm text-slate-500">{item.developer || item.category}</p></td><td className="p-4 text-sm text-slate-600">{item.city} - {item.state}</td><td className="p-4 font-semibold">{formatCurrency(item.priceFrom)}</td><td className="p-4"><Status value={item.status} /></td><td className="p-4">{item.featured ? "Sim" : "Não"}</td><td className="p-4"><div className="flex justify-end gap-2"><Link href={`/empreendimentos/${item.slug}`} target="_blank" className="rounded-lg bg-slate-100 p-2"><ExternalLink size={17} /></Link><button onClick={() => setDevelopmentForm(item)} className="rounded-lg bg-blue-50 p-2 text-blue-800"><Pencil size={17} /></button><button onClick={() => runAction(() => archiveDevelopment(item.id), "Empreendimento arquivado.")} className="rounded-lg bg-red-50 p-2 text-red-700"><Archive size={17} /></button></div></td></tr>)}</tbody></table></div>
                    {developments.length === 0 && <Empty text="Nenhum empreendimento cadastrado." />}
                  </div>
                </section>
              )}

              {tab === "properties" && (
                <section>
                  <PageHeader title="Imóveis e unidades" subtitle="Controle preço, comissão e disponibilidade sem retirar o empreendimento do ar." actionLabel="Novo imóvel" onAction={() => setPropertyForm(null)} />
                  <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {properties.map((item) => {
                      const development = developments.find((current) => current.id === item.developmentId);
                      return <article key={item.id} className="rounded-2xl bg-white p-5 shadow-sm"><div className="flex items-start justify-between"><div><p className="text-xs font-bold uppercase text-slate-400">{item.code || "Sem código"}</p><h2 className="mt-1 text-xl font-extrabold text-slate-900">{item.title}</h2><p className="mt-1 text-sm text-slate-500">{development?.name || "Sem empreendimento"}</p></div><Status value={item.status} /></div><p className="mt-5 text-2xl font-extrabold text-blue-950">{formatCurrency(item.price)}</p><p className="mt-2 text-sm text-slate-500">{item.bedrooms ?? "-"} dorm. · {item.area ? `${item.area} m²` : "área sob consulta"}</p><div className="mt-5 flex gap-2 border-t border-slate-100 pt-4"><button onClick={() => setPropertyForm(item)} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-50 px-4 py-2.5 font-bold text-blue-800"><Pencil size={16} /> Editar</button><button onClick={() => runAction(() => archiveProperty(item.id), "Imóvel arquivado.")} className="rounded-xl bg-red-50 p-3 text-red-700"><Archive size={16} /></button></div></article>;
                    })}
                    {properties.length === 0 && <div className="md:col-span-2 xl:col-span-3"><Empty text="Nenhum imóvel ou unidade cadastrado." /></div>}
                  </div>
                </section>
              )}
            </>
          )}
        </main>
      </div>

      {developmentForm !== undefined && <DevelopmentForm item={developmentForm ?? undefined} onClose={() => setDevelopmentForm(undefined)} onSaved={() => { setDevelopmentForm(undefined); setActionMessage("Empreendimento salvo com sucesso."); }} />}
      {propertyForm !== undefined && <PropertyForm developments={developments} item={propertyForm ?? undefined} onClose={() => setPropertyForm(undefined)} onSaved={() => { setPropertyForm(undefined); setActionMessage("Imóvel salvo com sucesso."); }} />}
    </div>
  );
}

function SetupMessage() { return <main className="grid min-h-screen place-items-center bg-slate-100 px-6"><div className="max-w-2xl rounded-3xl bg-white p-8 shadow-xl"><h1 className="text-3xl font-extrabold text-slate-950">Configure o Firebase do site</h1><p className="mt-3 leading-7 text-slate-600">{firebaseConfigurationError}</p><pre className="mt-6 overflow-x-auto rounded-2xl bg-slate-950 p-5 text-sm text-slate-100">{`NEXT_PUBLIC_FIREBASE_API_KEY=\nNEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=\nNEXT_PUBLIC_FIREBASE_PROJECT_ID=atlas-ai-83f0d\nNEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=\nNEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=\nNEXT_PUBLIC_FIREBASE_APP_ID=`}</pre><p className="mt-5 text-sm text-slate-500">Use as mesmas credenciais públicas do Atlas. Não coloque chave de conta de serviço no navegador.</p></div></main>; }
function Centered({ text, compact = false }: { text: string; compact?: boolean }) { return <div className={`grid place-items-center text-slate-500 ${compact ? "min-h-72" : "min-h-screen"}`}><div className="flex items-center gap-3"><RefreshCw className="animate-spin" size={20} /> {text}</div></div>; }
function NavButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) { return <button onClick={onClick} className={`mb-1 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-bold transition ${active ? "bg-blue-950 text-white" : "text-slate-600 hover:bg-slate-100"}`}>{icon}{label}</button>; }
function Metric({ label, value, note }: { label: string; value: number; note: string }) { return <div className="rounded-2xl bg-white p-5 shadow-sm"><p className="text-sm font-semibold text-slate-500">{label}</p><p className="mt-2 text-4xl font-extrabold text-slate-950">{value}</p><p className="mt-1 text-xs text-slate-400">{note}</p></div>; }
function PageHeader({ title, subtitle, actionLabel, onAction }: { title: string; subtitle: string; actionLabel: string; onAction: () => void }) { return <div className="flex flex-wrap items-end justify-between gap-4"><div><h1 className="text-3xl font-extrabold text-slate-950">{title}</h1><p className="mt-2 text-slate-500">{subtitle}</p></div><button onClick={onAction} className="flex items-center gap-2 rounded-xl bg-blue-950 px-5 py-3 font-bold text-white"><Plus size={18} /> {actionLabel}</button></div>; }
function Status({ value }: { value: string }) { const styles: Record<string, string> = { published: "bg-emerald-100 text-emerald-800", available: "bg-emerald-100 text-emerald-800", draft: "bg-amber-100 text-amber-800", reserved: "bg-amber-100 text-amber-800", sold: "bg-blue-100 text-blue-800", archived: "bg-slate-200 text-slate-700", inactive: "bg-slate-200 text-slate-700" }; const labels: Record<string, string> = { published: "Publicado", available: "Disponível", draft: "Rascunho", reserved: "Reservado", sold: "Vendido", archived: "Arquivado", inactive: "Inativo" }; return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${styles[value] ?? "bg-slate-100"}`}>{labels[value] ?? value}</span>; }
function Empty({ text }: { text: string }) { return <div className="p-10 text-center text-slate-500">{text}</div>; }
function CompactDevelopment({ item }: { item: Development }) { return <div className="flex items-center justify-between rounded-xl border border-slate-100 p-3"><div><p className="font-bold text-slate-900">{item.name}</p><p className="text-sm text-slate-500">{item.city} · {item.category}</p></div><Status value={item.status} /></div>; }
function CompactProperty({ item, development }: { item: PropertyUnit; development?: Development }) { return <div className="flex items-center justify-between rounded-xl border border-slate-100 p-3"><div><p className="font-bold text-slate-900">{item.title}</p><p className="text-sm text-slate-500">{development?.name || "Sem empreendimento"}</p></div><p className="font-bold text-blue-950">{formatCurrency(item.price)}</p></div>; }
