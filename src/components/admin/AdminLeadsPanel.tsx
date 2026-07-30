"use client";

import { DragEvent, useEffect, useMemo, useState } from "react";
import { Columns3, DatabaseZap, Eye, FileSpreadsheet, List, MessageCircle, Phone, Plus, RefreshCw, Search, SlidersHorizontal, Trash2, UserRoundCheck, WandSparkles } from "lucide-react";
import { assignLead, deleteLead, distributeUnassignedLeads, standardizeExistingLeads, subscribeToBrokers, subscribeToWebsiteLeads, updateLeadStage } from "@/services/adminService";
import type { BrokerRecord, UserRole, WebsiteLeadRecord } from "@/types/admin";
import LeadDetailDrawer from "./LeadDetailDrawer";
import LeadImportModal from "./LeadImportModal";
import ManualLeadModal from "./ManualLeadModal";

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

type ViewMode = "table" | "kanban";

export default function AdminLeadsPanel({ userRole = "admin", currentBrokerId = "" }: { userRole?: UserRole; currentBrokerId?: string }) {
  const [leads, setLeads] = useState<WebsiteLeadRecord[]>([]);
  const [brokers, setBrokers] = useState<BrokerRecord[]>([]);
  const [query, setQuery] = useState("");
  const [stageFilter, setStageFilter] = useState("");
  const [brokerFilter, setBrokerFilter] = useState(userRole === "broker" ? currentBrokerId : "");
  const [sourceFilter, setSourceFilter] = useState("");
  const [message, setMessage] = useState("");
  const [view, setView] = useState<ViewMode>("kanban");
  const [busy, setBusy] = useState(false);
  const [selectedLead, setSelectedLead] = useState<WebsiteLeadRecord | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set<string>());
  const [manualModal, setManualModal] = useState(false);
  const [importModal, setImportModal] = useState(false);

  useEffect(() => subscribeToWebsiteLeads(setLeads, (error) => setMessage(error.message), userRole === "broker" ? currentBrokerId : undefined), [userRole, currentBrokerId]);
  useEffect(() => subscribeToBrokers(setBrokers, (error) => setMessage(error.message)), []);
  useEffect(() => {
    if (userRole === "broker" && currentBrokerId) setBrokerFilter(currentBrokerId);
  }, [userRole, currentBrokerId]);

  const visibleLeads = useMemo(() => userRole === "broker" && currentBrokerId
    ? leads.filter((lead) => lead.assignedTo === currentBrokerId)
    : leads, [leads, userRole, currentBrokerId]);

  const sources = useMemo(() => [...new Set(visibleLeads.map((lead) => lead.source).filter(Boolean))].sort(), [visibleLeads]);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return visibleLeads.filter((lead) => {
      const matchesQuery = !term || [lead.name, lead.phone, lead.email, lead.city, lead.propertyInterest, lead.campaign].join(" ").toLowerCase().includes(term);
      const matchesStage = !stageFilter || lead.stage === stageFilter;
      const matchesBroker = !brokerFilter || lead.assignedTo === brokerFilter;
      const matchesSource = !sourceFilter || lead.source === sourceFilter;
      return matchesQuery && matchesStage && matchesBroker && matchesSource;
    });
  }, [visibleLeads, query, stageFilter, brokerFilter, sourceFilter]);

  const canManage = userRole === "admin" || userRole === "manager";
  const canDelete = userRole === "admin";
  const selectableIds = useMemo(() => filtered.filter((lead) => !lead.assignedTo).map((lead) => lead.id), [filtered]);
  const selectedCount = useMemo(() => selectableIds.filter((id) => selectedIds.has(id)).length, [selectableIds, selectedIds]);
  const allSelectableSelected = selectableIds.length > 0 && selectableIds.every((id) => selectedIds.has(id));

  function toggleLeadSelection(leadId: string) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(leadId)) next.delete(leadId);
      else next.add(leadId);
      return next;
    });
  }

  function toggleAllSelectable() {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (allSelectableSelected) selectableIds.forEach((id) => next.delete(id));
      else selectableIds.forEach((id) => next.add(id));
      return next;
    });
  }

  async function runDistribution() {
    const leadIds = selectableIds.filter((id) => selectedIds.has(id));
    if (leadIds.length === 0) {
      setMessage("Selecione pelo menos um lead sem responsável.");
      return;
    }

    setBusy(true);
    setMessage("");
    try {
      const count = await distributeUnassignedLeads(leadIds);
      setSelectedIds(new Set<string>());
      setMessage(`${count} lead${count === 1 ? "" : "s"} distribuído${count === 1 ? "" : "s"} pela roleta.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível distribuir os leads.");
    } finally {
      setBusy(false);
    }
  }

  async function runStandardization() {
    if (!canDelete) return;
    const confirmed = window.confirm("Padronizar nomes, cidades, interesses, campanhas, e-mails e telefones de todos os leads já cadastrados?");
    if (!confirmed) return;

    setBusy(true);
    setMessage("");
    try {
      const count = await standardizeExistingLeads();
      setMessage(`${count} cadastro${count === 1 ? "" : "s"} padronizado${count === 1 ? "" : "s"}. Os novos cadastros já serão corrigidos automaticamente.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível padronizar os cadastros.");
    } finally {
      setBusy(false);
    }
  }

  async function removeLead(lead: WebsiteLeadRecord) {
    if (!canDelete) return;
    const confirmed = window.confirm(`Excluir definitivamente o lead "${lead.name}"? Esta ação não pode ser desfeita.`);
    if (!confirmed) return;

    setBusy(true);
    setMessage("");
    try {
      await deleteLead(lead.id);
      setSelectedIds((current) => {
        const next = new Set(current);
        next.delete(lead.id);
        return next;
      });
      if (selectedLead?.id === lead.id) setSelectedLead(null);
      setMessage(`${lead.name} foi excluído com sucesso.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível excluir o lead.");
    } finally {
      setBusy(false);
    }
  }

  async function dropLead(event: DragEvent<HTMLDivElement>, stage: string) {
    event.preventDefault();
    const leadId = event.dataTransfer.getData("text/lead-id");
    if (leadId) await updateLeadStage(leadId, stage);
  }

  function clearFilters() {
    setQuery("");
    setStageFilter("");
    setSourceFilter("");
    if (userRole !== "broker") setBrokerFilter("");
  }

  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><p className="text-sm font-bold text-blue-800">CARTEIRA COMERCIAL</p><h1 className="text-3xl font-extrabold text-slate-950">Clientes e leads</h1><p className="mt-2 text-slate-500">Cadastre, importe, distribua e acompanhe cada cliente pelo funil.</p></div>
        <div className="flex w-full flex-wrap justify-end gap-2 xl:w-auto">
          {canManage && <button onClick={() => setImportModal(true)} className="flex items-center gap-2 rounded-xl border border-blue-950 px-4 py-3 text-sm font-bold text-blue-950"><FileSpreadsheet size={17}/> Importar planilha</button>}
          <button onClick={() => setManualModal(true)} className="flex items-center gap-2 rounded-xl bg-blue-950 px-4 py-3 text-sm font-bold text-white"><Plus size={17}/> Novo cliente</button>
          {canDelete && <button onClick={runStandardization} disabled={busy} className="flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-3 text-sm font-bold text-slate-700 disabled:opacity-50"><DatabaseZap size={17}/> Padronizar cadastros</button>}
          {canManage && <button onClick={runDistribution} disabled={busy || selectedCount === 0} className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40">{busy ? <RefreshCw className="animate-spin" size={17}/> : <WandSparkles size={17}/>} Distribuir selecionados ({selectedCount})</button>}
        </div>
      </div>

      {message && <p className="mt-4 rounded-xl bg-blue-50 p-4 text-sm text-blue-800">{message}</p>}

      <div className="mt-5 rounded-2xl bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <label className="relative min-w-64 flex-1"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18}/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar nome, telefone, cidade ou imóvel" className="h-12 w-full rounded-xl border border-slate-200 pl-11 pr-4 outline-none focus:border-blue-700"/></label>
          <Filter value={stageFilter} onChange={setStageFilter} label="Todas as etapas" options={STAGES.map(([value, label]) => [value, label] as [string, string])}/>
          {userRole !== "broker" && <Filter value={brokerFilter} onChange={setBrokerFilter} label="Todos os corretores" options={brokers.map((broker) => [broker.id, broker.name] as [string, string])}/>} 
          <Filter value={sourceFilter} onChange={setSourceFilter} label="Todas as origens" options={sources.map((source) => [source, sourceLabel(source)] as [string, string])}/>
          <button onClick={clearFilters} className="flex h-12 items-center gap-2 rounded-xl bg-slate-100 px-4 text-sm font-bold text-slate-600"><SlidersHorizontal size={17}/> Limpar</button>
          <div className="flex rounded-xl border border-slate-200 bg-white p-1"><button onClick={() => setView("kanban")} className={`rounded-lg p-2.5 ${view === "kanban" ? "bg-blue-950 text-white" : "text-slate-500"}`} aria-label="Kanban"><Columns3 size={18}/></button><button onClick={() => setView("table")} className={`rounded-lg p-2.5 ${view === "table" ? "bg-blue-950 text-white" : "text-slate-500"}`} aria-label="Tabela"><List size={18}/></button></div>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs font-semibold text-slate-400">
          <p>{filtered.length} de {visibleLeads.length} clientes exibidos</p>
          {canManage && <button type="button" onClick={toggleAllSelectable} disabled={selectableIds.length === 0} className="rounded-lg bg-slate-100 px-3 py-2 text-slate-600 disabled:opacity-40">{allSelectableSelected ? "Desmarcar todos" : `Selecionar sem responsável (${selectableIds.length})`}</button>}
        </div>
      </div>

      {view === "kanban" ? (
        <div className="mt-6 overflow-x-auto pb-4"><div className="flex min-w-max gap-4">{STAGES.filter(([stage]) => !stageFilter || stage === stageFilter).map(([stage, label]) => {
          const stageLeads = filtered.filter((lead) => lead.stage === stage);
          return <div key={stage} onDragOver={(event) => event.preventDefault()} onDrop={(event) => dropLead(event, stage)} className="w-80 shrink-0 rounded-2xl bg-slate-100 p-3">
            <div className="mb-3 flex items-center justify-between px-1"><h2 className="font-extrabold text-slate-800">{label}</h2><span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-slate-600">{stageLeads.length}</span></div>
            <div className="space-y-3">{stageLeads.map((lead) => <LeadCard key={lead.id} lead={lead} brokers={brokers} onOpen={() => setSelectedLead(lead)} canAssign={canManage} canDelete={canDelete} selected={selectedIds.has(lead.id)} onToggleSelection={() => toggleLeadSelection(lead.id)} onDelete={() => removeLead(lead)}/>)}{stageLeads.length === 0 && <div className="rounded-xl border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-400">Arraste um cliente para cá</div>}</div>
          </div>;
        })}</div></div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-2xl bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1120px] text-left">
              <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  {canManage && <th className="w-12 p-4 text-center"><input type="checkbox" checked={allSelectableSelected} disabled={selectableIds.length === 0} onChange={toggleAllSelectable} aria-label="Selecionar todos os leads sem responsável exibidos" className="h-4 w-4 rounded border-slate-300"/></th>}
                  <th className="p-4">Cliente</th><th className="p-4">Interesse</th><th className="p-4">Origem</th><th className="p-4">Corretor</th><th className="p-4">Etapa</th><th className="p-4">Contato</th>
                </tr>
              </thead>
              <tbody>{filtered.map((lead) => <tr key={lead.id} className="border-t border-slate-100 align-top">
                {canManage && <td className="p-4 text-center"><input type="checkbox" checked={selectedIds.has(lead.id)} disabled={Boolean(lead.assignedTo) || busy} onChange={() => toggleLeadSelection(lead.id)} aria-label={`Selecionar ${lead.name}`} className="h-4 w-4 rounded border-slate-300 disabled:opacity-30"/></td>}
                <td className="p-4"><button onClick={() => setSelectedLead(lead)} className="text-left"><p className="font-bold text-slate-900 hover:text-blue-800">{lead.name}</p></button><p className="text-sm text-slate-500">{lead.city || "Cidade não informada"}</p></td>
                <td className="p-4"><p className="font-semibold text-slate-800">{lead.propertyInterest || "Interesse geral"}</p><p className="text-xs text-slate-500">{lead.createdAt ? new Date(lead.createdAt).toLocaleString("pt-BR") : ""}</p></td>
                <td className="p-4 text-sm text-slate-600">{sourceLabel(lead.campaign || lead.utmSource || lead.source)}</td>
                <td className="p-4"><BrokerSelect lead={lead} brokers={brokers} disabled={!canManage}/></td>
                <td className="p-4"><select value={lead.stage} onChange={(event) => updateLeadStage(lead.id, event.target.value)} className="h-10 min-w-44 rounded-lg border border-slate-200 px-3">{STAGES.map(([value, stageLabel]) => <option key={value} value={value}>{stageLabel}</option>)}</select></td>
                <td className="p-4"><div className="flex items-center gap-2"><ContactButtons lead={lead}/><button onClick={() => setSelectedLead(lead)} className="rounded-lg bg-blue-50 p-2 text-blue-800" aria-label="Abrir perfil"><Eye size={16}/></button>{canDelete && <button onClick={() => removeLead(lead)} disabled={busy} className="rounded-lg bg-red-50 p-2 text-red-700 disabled:opacity-40" aria-label={`Excluir ${lead.name}`}><Trash2 size={16}/></button>}</div></td>
              </tr>)}</tbody>
            </table>
          </div>
          {filtered.length === 0 && <Empty/>}
        </div>
      )}

      {selectedLead && <LeadDetailDrawer lead={selectedLead} canDelete={canDelete} onDeleted={(name) => { setSelectedLead(null); setMessage(`${name} foi excluído com sucesso.`); }} onClose={() => setSelectedLead(null)}/>} 
      {manualModal && <ManualLeadModal brokers={brokers} defaultAssignedTo={userRole === "broker" ? currentBrokerId : ""} lockAssignedTo={userRole === "broker"} onClose={() => setManualModal(false)} onSaved={setMessage}/>} 
      {importModal && <LeadImportModal onClose={() => setImportModal(false)} onImported={setMessage}/>} 
    </section>
  );
}

function Filter({ value, onChange, label, options }: { value: string; onChange: (value: string) => void; label: string; options: (readonly [string, string])[] }) {
  return <select value={value} onChange={(event) => onChange(event.target.value)} className="h-12 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700"><option value="">{label}</option>{options.map(([optionValue, optionLabel]) => <option key={optionValue} value={optionValue}>{optionLabel}</option>)}</select>;
}

function LeadCard({ lead, brokers, onOpen, canAssign, canDelete, selected, onToggleSelection, onDelete }: { lead: WebsiteLeadRecord; brokers: BrokerRecord[]; onOpen: () => void; canAssign: boolean; canDelete: boolean; selected: boolean; onToggleSelection: () => void; onDelete: () => void }) {
  return <article draggable onDragStart={(event) => { event.dataTransfer.setData("text/lead-id", lead.id); event.dataTransfer.effectAllowed = "move"; }} className="cursor-grab rounded-xl bg-white p-4 shadow-sm active:cursor-grabbing">
    <div className="flex items-start justify-between gap-3">
      <div className="flex min-w-0 items-start gap-3">
        {canAssign && <input type="checkbox" checked={selected} disabled={Boolean(lead.assignedTo)} onClick={(event) => event.stopPropagation()} onChange={onToggleSelection} aria-label={`Selecionar ${lead.name}`} className="mt-1 h-4 w-4 rounded border-slate-300 disabled:opacity-30"/>}
        <div><button onClick={onOpen} className="text-left"><h3 className="font-extrabold text-slate-900 hover:text-blue-800">{lead.name}</h3></button><p className="mt-1 text-sm text-slate-500">{lead.propertyInterest || "Interesse geral"}</p></div>
      </div>
      <div className="flex shrink-0 gap-2"><ContactButtons lead={lead}/>{canDelete && <button onClick={onDelete} className="rounded-lg bg-red-50 p-2 text-red-700" aria-label={`Excluir ${lead.name}`}><Trash2 size={16}/></button>}</div>
    </div>
    <p className="mt-3 text-xs text-slate-400">{lead.city || "Cidade não informada"} · {sourceLabel(lead.campaign || lead.utmSource || lead.source)}</p>
    <div className="mt-3"><BrokerSelect lead={lead} brokers={brokers} disabled={!canAssign}/></div>
  </article>;
}

function BrokerSelect({ lead, brokers, disabled = false }: { lead: WebsiteLeadRecord; brokers: BrokerRecord[]; disabled?: boolean }) {
  return <select value={lead.assignedTo} disabled={disabled} onChange={(event) => assignLead(lead.id, event.target.value)} className="h-10 w-full min-w-44 rounded-lg border border-slate-200 px-3 text-sm disabled:bg-slate-50"><option value="">Sem responsável</option>{brokers.filter((item) => item.active || item.id === lead.assignedTo).map((broker) => <option key={broker.id} value={broker.id}>{broker.name}{broker.active ? "" : " (inativo)"}</option>)}</select>;
}

function ContactButtons({ lead }: { lead: WebsiteLeadRecord }) {
  return <div className="flex shrink-0 gap-2"><a href={`tel:+55${lead.phone}`} className="rounded-lg bg-slate-100 p-2 text-slate-700" aria-label="Ligar"><Phone size={16}/></a><a href={`https://wa.me/55${lead.phone}?text=${encodeURIComponent(`Olá, ${lead.name}! Aqui é da Moratta Imóveis. Vi seu interesse em ${lead.propertyInterest || "nossos imóveis"}.`)}`} target="_blank" rel="noreferrer" className="rounded-lg bg-emerald-100 p-2 text-emerald-700" aria-label="WhatsApp"><MessageCircle size={16}/></a></div>;
}

function sourceLabel(value: string) {
  const labels: Record<string, string> = { carteira_antiga: "Carteira antiga", indicacao: "Indicação", manual: "Cadastro manual", meta: "Meta/Facebook", plantao: "Plantão", construtora: "Construtora", ligacao: "Ligação" };
  return labels[value] ?? (value || "Não informada");
}

function Empty() { return <div className="py-16 text-center text-slate-500"><UserRoundCheck className="mx-auto mb-3"/><p>Nenhum cliente encontrado.</p></div>; }
