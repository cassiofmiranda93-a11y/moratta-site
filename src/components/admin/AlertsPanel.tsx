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
} from "lucide-react";
import { buildCrmAlerts, crmAlertOccurrenceId, filterOpenCrmAlerts } from "@/lib/crmAlerts";
import {
  completeCrmAlert,
  subscribeToCompletedCrmAlerts,
  subscribeToSales,
  subscribeToWebsiteLeads,
} from "@/services/adminService";
import type { CrmAlert, CrmAlertSeverity, SaleRecord, UserRole, WebsiteLeadRecord } from "@/types/admin";

export default function AlertsPanel({
  userRole,
  currentBrokerId,
}: {
  userRole: UserRole;
  currentBrokerId: string;
}) {
  const [leads, setLeads] = useState<WebsiteLeadRecord[]>([]);
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [completedOccurrences, setCompletedOccurrences] = useState<string[]>([]);
  const [finishingId, setFinishingId] = useState("");
  const [message, setMessage] = useState("");
  const brokerFilter = userRole === "broker" ? currentBrokerId : undefined;

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
      subscribeToCompletedCrmAlerts(
        setCompletedOccurrences,
        (error) => setMessage(error.message),
      ),
    [],
  );

  const generatedAlerts = useMemo(() => buildCrmAlerts(leads, sales), [leads, sales]);
  const alerts = useMemo(
    () => filterOpenCrmAlerts(generatedAlerts, completedOccurrences),
    [generatedAlerts, completedOccurrences],
  );
  const critical = alerts.filter((item) => item.severity === "critical").length;
  const invoice = alerts.filter((item) => item.type === "invoice_due").length;
  const payments = alerts.filter((item) => item.type === "payment_due" || item.type === "payment_overdue").length;

  async function finishAlert(alert: CrmAlert) {
    const occurrenceId = crmAlertOccurrenceId(alert);
    setFinishingId(occurrenceId);
    setMessage("");
    try {
      await completeCrmAlert(alert);
      setCompletedOccurrences((current) =>
        current.includes(occurrenceId) ? current : [...current, occurrenceId],
      );
      setMessage("Alerta finalizado com sucesso.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível finalizar o alerta.");
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
      <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric icon={<AlertTriangle />} label="Críticos" value={critical} note="ação imediata" />
        <Metric
          icon={<Clock3 />}
          label="Total de alertas"
          value={alerts.length}
          note="pendências detectadas"
        />
        <Metric
          icon={<CalendarClock />}
          label="Notas fiscais"
          value={invoice}
          note="emissão próxima ou vencida"
        />
        <Metric
          icon={<CircleDollarSign />}
          label="Recebimentos"
          value={payments}
          note="próximos ou atrasados"
        />
      </div>
      <div className="mt-6 space-y-3">
        {alerts.map((alert) => {
          const occurrenceId = crmAlertOccurrenceId(alert);
          const isFinishing = finishingId === occurrenceId;
          return (
            <article
              key={occurrenceId}
              className={`rounded-2xl border p-5 ${alertClasses(alert.severity)}`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-extrabold">{alert.title}</p>
                  <p className="mt-1 text-sm opacity-80">{alert.description}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-bold uppercase">
                    {severityLabel(alert.severity)}
                  </span>
                  <button
                    type="button"
                    onClick={() => finishAlert(alert)}
                    disabled={Boolean(finishingId)}
                    aria-label={`Marcar ${alert.title} como finalizado`}
                    className="flex items-center gap-1.5 rounded-lg bg-emerald-700 px-3 py-2 text-xs font-bold text-white transition hover:bg-emerald-800 disabled:cursor-wait disabled:opacity-60"
                  >
                    {isFinishing ? (
                      <RefreshCw className="animate-spin" size={15} />
                    ) : (
                      <CheckCircle2 size={15} />
                    )}{" "}
                    Finalizado
                  </button>
                </div>
              </div>
              <p className="mt-3 text-xs font-semibold opacity-70">
                Prazo: {new Date(alert.dueAt).toLocaleString("pt-BR")}
              </p>
            </article>
          );
        })}
        {alerts.length === 0 && (
          <div className="rounded-2xl bg-white py-16 text-center text-slate-400">
            Nenhuma pendência urgente encontrada.
          </div>
        )}
      </div>
    </section>
  );
}

function Metric({ icon, label, value, note }: { icon: React.ReactNode; label: string; value: number; note: string }) { return <div className="rounded-2xl bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><p className="text-sm font-semibold text-slate-500">{label}</p><span className="text-blue-800">{icon}</span></div><p className="mt-3 text-4xl font-extrabold text-slate-950">{value}</p><p className="mt-1 text-xs text-slate-400">{note}</p></div>; }
function alertClasses(severity: CrmAlertSeverity) { return severity === "critical" ? "border-red-200 bg-red-50 text-red-900" : severity === "warning" ? "border-amber-200 bg-amber-50 text-amber-900" : "border-blue-200 bg-blue-50 text-blue-900"; }
function severityLabel(severity: CrmAlertSeverity) { return severity === "critical" ? "Crítico" : severity === "warning" ? "Atenção" : "Informativo"; }
