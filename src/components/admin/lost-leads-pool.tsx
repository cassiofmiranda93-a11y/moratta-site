"use client";

import { useEffect, useMemo, useState } from "react";
import { Archive, Eye, RefreshCw, RotateCcw, Search } from "lucide-react";

import {
  restoreLostLead,
  subscribeToBrokers,
  subscribeToLostLeads,
} from "@/services/adminService";
import type { BrokerRecord, WebsiteLeadRecord } from "@/types/admin";

import LeadDetailDrawer from "./LeadDetailDrawer";

export default function LostLeadsPool() {
  const [leads, setLeads] = useState<WebsiteLeadRecord[]>([]);
  const [brokers, setBrokers] = useState<BrokerRecord[]>([]);
  const [query, setQuery] = useState("");
  const [selectedLead, setSelectedLead] = useState<WebsiteLeadRecord | null>(null);
  const [restoringId, setRestoringId] = useState("");
  const [message, setMessage] = useState("");

  useEffect(
    () =>
      subscribeToLostLeads(
        (nextLeads) => {
          setLeads(nextLeads);
          setSelectedLead((current) => {
            if (!current) return null;
            return nextLeads.find((lead) => lead.id === current.id) ?? null;
          });
        },
        (error) => setMessage(error.message),
      ),
    [],
  );
  useEffect(
    () => subscribeToBrokers(setBrokers, (error) => setMessage(error.message)),
    [],
  );

  const brokerNames = useMemo(
    () => new Map(brokers.map((broker) => [broker.id, broker.name || broker.email])),
    [brokers],
  );
  const filteredLeads = useMemo(() => {
    const term = query.trim().toLocaleLowerCase("pt-BR");
    if (!term) return leads;
    return leads.filter((lead) =>
      [
        lead.name,
        lead.phone,
        lead.city,
        lead.propertyInterest,
        brokerNames.get(lead.assignedTo) ?? "",
      ]
        .join(" ")
        .toLocaleLowerCase("pt-BR")
        .includes(term),
    );
  }, [brokerNames, leads, query]);

  async function restoreLead(lead: WebsiteLeadRecord) {
    const confirmed = window.confirm(
      `Devolver "${lead.name}" ao funil? O lead voltará como novo e sem corretor responsável.`,
    );
    if (!confirmed) return;

    setRestoringId(lead.id);
    setMessage("");
    try {
      await restoreLostLead(lead.id);
      setSelectedLead((current) => (current?.id === lead.id ? null : current));
      setMessage(`${lead.name} voltou ao funil e está aguardando nova distribuição.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível recuperar o lead.");
    } finally {
      setRestoringId("");
    }
  }

  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="flex items-center gap-2 text-sm font-bold text-blue-800">
            <Archive size={17} /> ACESSO EXCLUSIVO DO ADMINISTRADOR
          </p>
          <h1 className="text-3xl font-extrabold text-slate-950">Bolsão de leads perdidos</h1>
          <p className="mt-2 text-slate-500">
            Leads perdidos ficam fora da carteira dos corretores até você decidir recuperá-los.
          </p>
        </div>
        <div className="rounded-2xl bg-white px-5 py-4 text-right shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">No bolsão</p>
          <p className="mt-1 text-3xl font-extrabold text-slate-950">{leads.length}</p>
        </div>
      </div>

      {message && (
        <p className="mt-4 rounded-xl bg-blue-50 p-4 text-sm font-semibold text-blue-800">
          {message}
        </p>
      )}

      <div className="mt-6 rounded-2xl bg-white p-4 shadow-sm">
        <label className="relative block max-w-xl">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            size={18}
          />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar cliente, telefone, cidade, interesse ou corretor"
            className="h-12 w-full rounded-xl border border-slate-200 pl-11 pr-4 outline-none focus:border-blue-700"
          />
        </label>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left">
            <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="p-4">Cliente</th>
                <th className="p-4">Interesse</th>
                <th className="p-4">Último corretor</th>
                <th className="p-4">Entrada no bolsão</th>
                <th className="p-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeads.map((lead) => (
                <tr key={lead.id} className="border-t border-slate-100">
                  <td className="p-4">
                    <button
                      type="button"
                      onClick={() => setSelectedLead(lead)}
                      className="text-left font-bold text-slate-900 hover:text-blue-800"
                    >
                      {lead.name}
                    </button>
                    <p className="mt-1 text-sm text-slate-500">
                      {lead.phone || "Telefone não informado"} · {lead.city || "Cidade não informada"}
                    </p>
                  </td>
                  <td className="p-4 text-sm font-semibold text-slate-700">
                    {lead.propertyInterest || "Interesse não informado"}
                  </td>
                  <td className="p-4 text-sm text-slate-600">
                    {lead.assignedTo
                      ? brokerNames.get(lead.assignedTo) ?? "Corretor removido"
                      : "Sem corretor"}
                  </td>
                  <td className="p-4 text-sm text-slate-600">
                    {formatDate(lead.lostAt ?? lead.updatedAt)}
                  </td>
                  <td className="p-4">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedLead(lead)}
                        className="rounded-lg bg-blue-50 p-2.5 text-blue-800"
                        aria-label={`Abrir ${lead.name}`}
                      >
                        <Eye size={17} />
                      </button>
                      <button
                        type="button"
                        onClick={() => void restoreLead(lead)}
                        disabled={Boolean(restoringId)}
                        className="flex items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {restoringId === lead.id ? (
                          <RefreshCw className="animate-spin" size={17} />
                        ) : (
                          <RotateCcw size={17} />
                        )}
                        Devolver ao funil
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredLeads.length === 0 && (
          <div className="px-6 py-16 text-center">
            <Archive className="mx-auto text-slate-300" size={36} />
            <p className="mt-3 text-sm text-slate-400">
              {leads.length === 0
                ? "Nenhum lead está no bolsão de perdidos."
                : "Nenhum lead corresponde à busca."}
            </p>
          </div>
        )}
      </div>

      {selectedLead && (
        <LeadDetailDrawer
          key={selectedLead.id}
          lead={selectedLead}
          canDelete
          onDeleted={(name) => {
            setSelectedLead(null);
            setMessage(`${name} foi excluído com sucesso.`);
          }}
          onClose={() => setSelectedLead(null)}
        />
      )}
    </section>
  );
}

function formatDate(value: string | null | undefined) {
  if (!value) return "Data não informada";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Data não informada";
  return date.toLocaleString("pt-BR");
}
