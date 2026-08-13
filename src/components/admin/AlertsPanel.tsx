"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  BellRing,
  CalendarClock,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  RefreshCw,
  UsersRound,
} from "lucide-react";
import {
  buildCrmAlerts,
  crmAlertOccurrenceId,
  filterCrmAlertsByBroker,
  filterOpenCrmAlerts,
} from "@/lib/crmAlerts";
import {
  completeCrmAlert,
  completeCrmAlerts,
  subscribeToBrokers,
  subscribeToCompletedCrmAlerts,
  subscribeToSales,
  subscribeToWebsiteLeads,
} from "@/services/adminService";
import type {
  BrokerRecord,
  CrmAlert,
  CrmAlertSeverity,
  SaleRecord,
  UserRole,
  WebsiteLeadRecord,
} from "@/types/admin";

const UNASSIGNED_BROKER_FILTER = "__unassigned__";

export default function AlertsPanel({
  userRole,
  currentBrokerId,
}: {
  userRole: UserRole;
  currentBrokerId: string;
}) {
  const [leads, setLeads] = useState<WebsiteLeadRecord[]>([]);
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [brokers, setBrokers] = useState<BrokerRecord[]>([]);
  const [completedOccurrences, setCompletedOccurrences] = useState<string[]>([]);
  const [selectedOccurrences, setSelectedOccurrences] = useState<string[]>([]);
  const [selectedBrokerId, setSelectedBrokerId] = useState(
    userRole === "broker" ? currentBrokerId : "",
  );
  const [finishingId, setFinishingId] = useState("");
  const [message, setMessage] = useState("");
  const brokerFilter = userRole === "broker" ? currentBrokerId : undefined;
  const brokerIsRestricted = userRole === "broker" && Boolean(currentBrokerId);
  const effectiveSelectedBrokerId = brokerIsRestricted ? currentBrokerId : selectedBrokerId;

  useEffect(
    () =>
      userRole === "finance"
        ? undefined
        : subscribeToWebsiteLeads(
            setLeads,
            (error) => setMessage(error.message),
            brokerFilter,
          ),
    [brokerFilter, userRole],
  );
  useEffect(
    () => subscribeToSales(setSales, (error) => setMessage(error.message), brokerFilter),
    [brokerFilter],
  );
  useEffect(
    () =>
      subscribeToBrokers(
        setBrokers,
        () => setBrokers([]),
      ),
    [],
  );
  useEffect(
    () =>
      subscribeToCompletedCrmAlerts(
        setCompletedOccurrences,
        (error) =>
          setMessage(
            error.message.includes("permission")
              ? "O Firebase ainda não liberou os alertas finalizados. Publique as regras do Firestore antes de concluir alertas."
              : error.message,
          ),
        brokerFilter,
      ),
    [brokerFilter],
  );

  const generatedAlerts = useMemo(() => buildCrmAlerts(leads, sales), [leads, sales]);
  const openAlerts = useMemo(
    () => filterOpenCrmAlerts(generatedAlerts, completedOccurrences),
    [generatedAlerts, completedOccurrences],
  );
  const alerts = useMemo(
    () => filterCrmAlertsByBroker(openAlerts, effectiveSelectedBrokerId),
    [openAlerts, effectiveSelectedBrokerId],
  );
  const brokerNames = useMemo(
    () => new Map(brokers.map((broker) => [broker.id, broker.name || broker.email || broker.id])),
    [brokers],
  );
  const selectedAlerts = useMemo(
    () => alerts.filter((alert) => selectedOccurrences.includes(crmAlertOccurrenceId(alert))),
    [alerts, selectedOccurrences],
  );
  const allVisibleSelected = alerts.length > 0 && selectedAlerts.length === alerts.length;
  const critical = alerts.filter((item) => item.severity === "critical").length;
  const invoice = alerts.filter((item) => item.type === "invoice_due").length;
  const payments = alerts.filter((item) => item.type === "payment_due" || item.type === "payment_overdue").length;
  const isBulkFinishing = finishingId === "bulk";

  function brokerName(brokerId: string) {
    if (!brokerId) return "Sem corretor definido";
    return brokerNames.get(brokerId) ?? "Corretor removido da equipe";
  }

  function toggleSelection(alert: CrmAlert) {
    const occurrenceId = crmAlertOccurrenceId(alert);
    setSelectedOccurrences((current) =>
      current.includes(occurrenceId)
        ? current.filter((item) => item !== occurrenceId)
        : [...current, occurrenceId],
    );
  }

  function toggleAllVisible() {
    setSelectedOccurrences(allVisibleSelected ? [] : alerts.map(crmAlertOccurrenceId));
  }

  async function finishAlert(alert: CrmAlert) {
    const occurrenceId = crmAlertOccurrenceId(alert);
    setFinishingId(occurrenceId);
    setMessage("");
    try {
      await completeCrmAlert(alert);
      setCompletedOccurrences((current) =>
        current.includes(occurrenceId) ? current : [...current, occurrenceId],
      );
      setSelectedOccurrences((current) => current.filter((item) => item !== occurrenceId));
      setMessage("Alerta finalizado com sucesso.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível finalizar o alerta.");
    } finally {
      setFinishingId("");
    }
  }

  async function finishSelectedAlerts() {
    if (selectedAlerts.length === 0) return;

    setFinishingId("bulk");
    setMessage("");
    try {
      const occurrenceIds = await completeCrmAlerts(selectedAlerts);
      setCompletedOccurrences((current) => Array.from(new Set([...current, ...occurrenceIds])));
      setSelectedOccurrences([]);
      setMessage(`${occurrenceIds.length} alerta(s) finalizado(s) com sucesso.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível finalizar os alertas selecionados.");
    } finally {
      setFinishingId("");
    }
  }

  return (
    <section>
      <div>
        <p className="flex items-center gap-2 text-sm font-bold text-blue-800">
          <BellRing size={17} /> CENTRAL DE ALERTAS
        </p>
        <h1 className="text-3xl font-extrabold text-slate-950">Pendências e prazos</h1>
        <p className="mt-2 text-slate-500">
          Retornos, clientes parados, emissão de nota e recebimentos próximos ou atrasados.
        </p>
      </div>
      {message && (
        <p className="mt-4 rounded-xl bg-amber-50 p-4 text-sm text-amber-800">{message}</p>
      )}

      <div className="mt-6 flex flex-col gap-4 rounded-2xl bg-white p-4 shadow-sm sm:flex-row sm:items-end sm:justify-between">
        <label className="block max-w-sm flex-1 text-sm font-bold text-slate-700">
          <span className="flex items-center gap-2"><UsersRound size={16} /> Corretor responsável</span>
          <select
            value={effectiveSelectedBrokerId}
            onChange={(event) => {
              setSelectedBrokerId(event.target.value);
              setSelectedOccurrences([]);
            }}
            disabled={brokerIsRestricted || Boolean(finishingId)}
            className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-800 outline-none focus:border-blue-700 disabled:cursor-not-allowed disabled:bg-slate-100"
          >
            {!brokerIsRestricted && <option value="">Todos os corretores</option>}
            {!brokerIsRestricted && <option value={UNASSIGNED_BROKER_FILTER}>Sem corretor definido</option>}
            {brokers.map((broker) => (
              <option key={broker.id} value={broker.id}>{broker.name || broker.email || "Corretor sem nome"}</option>
            ))}
          </select>
        </label>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={toggleAllVisible}
            disabled={alerts.length === 0 || Boolean(finishingId)}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {allVisibleSelected ? "Limpar seleção" : "Selecionar filtrados"}
          </button>
          <button
            type="button"
            onClick={() => void finishSelectedAlerts()}
            disabled={selectedAlerts.length === 0 || Boolean(finishingId)}
            className="flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isBulkFinishing ? <RefreshCw className="animate-spin" size={16} /> : <CheckCircle2 size={16} />}
            Finalizar selecionados ({selectedAlerts.length})
          </button>
        </div>
      </div>

      <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric icon={<AlertTriangle />} label="Críticos" value={critical} note="ação imediata" />
        <Metric icon={<Clock3 />} label="Total de alertas" value={alerts.length} note="pendências no filtro" />
        <Metric icon={<CalendarClock />} label="Notas fiscais" value={invoice} note="emissão próxima ou vencida" />
        <Metric icon={<CircleDollarSign />} label="Recebimentos" value={payments} note="próximos ou atrasados" />
      </div>

      <div className="mt-6 space-y-3">
        {alerts.map((alert) => {
          const occurrenceId = crmAlertOccurrenceId(alert);
          const isFinishing = finishingId === occurrenceId;
          const isSelected = selectedOccurrences.includes(occurrenceId);
          return (
            <article
              key={occurrenceId}
              className={`rounded-2xl border p-5 ${alertClasses(alert.severity)}`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelection(alert)}
                    disabled={Boolean(finishingId)}
                    aria-label={`Selecionar ${alert.title}`}
                    className="mt-1 h-4 w-4 shrink-0 rounded border-slate-300 text-emerald-700 focus:ring-emerald-700"
                  />
                  <div>
                    <p className="font-extrabold">{alert.title}</p>
                    <p className="mt-1 text-sm opacity-80">{alert.description}</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-bold uppercase">
                    {severityLabel(alert.severity)}
                  </span>
                  <button
                    type="button"
                    onClick={() => void finishAlert(alert)}
                    disabled={Boolean(finishingId)}
                    aria-label={`Marcar ${alert.title} como finalizado`}
                    className="flex items-center gap-1.5 rounded-lg bg-emerald-700 px-3 py-2 text-xs font-bold text-white transition hover:bg-emerald-800 disabled:cursor-wait disabled:opacity-60"
                  >
                    {isFinishing ? <RefreshCw className="animate-spin" size={15} /> : <CheckCircle2 size={15} />} Finalizado
                  </button>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs font-semibold opacity-70">
                <span>Corretor: {brokerName(alert.brokerId)}</span>
                <span>Prazo: {new Date(alert.dueAt).toLocaleString("pt-BR")}</span>
              </div>
            </article>
          );
        })}
        {alerts.length === 0 && (
          <div className="rounded-2xl bg-white py-16 text-center text-slate-400">
            Nenhuma pendência urgente encontrada para este filtro.
          </div>
        )}
      </div>
    </section>
  );
}

function Metric({ icon, label, value, note }: { icon: React.ReactNode; label: string; value: number; note: string }) {
  return <div className="rounded-2xl bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><p className="text-sm font-semibold text-slate-500">{label}</p><span className="text-blue-800">{icon}</span></div><p className="mt-3 text-4xl font-extrabold text-slate-950">{value}</p><p className="mt-1 text-xs text-slate-400">{note}</p></div>;
}

function alertClasses(severity: CrmAlertSeverity) {
  return severity === "critical" ? "border-red-200 bg-red-50 text-red-900" : severity === "warning" ? "border-amber-200 bg-amber-50 text-amber-900" : "border-blue-200 bg-blue-50 text-blue-900";
}

function severityLabel(severity: CrmAlertSeverity) {
  return severity === "critical" ? "Crítico" : severity === "warning" ? "Atenção" : "Informativo";
}
