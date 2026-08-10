import type { CrmAlert, SaleRecord, WebsiteLeadRecord } from "@/types/admin";

const DAY = 86_400_000;

function dateMs(value: string | null | undefined) {
  if (!value) return null;
  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? timestamp : null;
}

function daysBetween(from: number, to: number) {
  return Math.floor((to - from) / DAY);
}

export function crmAlertOccurrenceId(alert: Pick<CrmAlert, "id" | "dueAt">) {
  const dueAt = dateMs(alert.dueAt);
  return `${alert.id}-${dueAt ?? alert.dueAt}`;
}

export function filterOpenCrmAlerts(alerts: CrmAlert[], completedOccurrences: Iterable<string>) {
  const completed = new Set(completedOccurrences);
  return alerts.filter((alert) => !completed.has(crmAlertOccurrenceId(alert)));
}

export function buildCrmAlerts(leads: WebsiteLeadRecord[], sales: SaleRecord[], now = new Date()): CrmAlert[] {
  const current = now.getTime();
  const alerts: CrmAlert[] = [];

  for (const lead of leads) {
    if (["won", "lost"].includes(lead.stage)) continue;
    const nextContact = dateMs(lead.nextContactAt);
    if (nextContact !== null && nextContact < current) {
      alerts.push({
        id: `lead-return-${lead.id}`,
        type: "lead_return",
        severity: "critical",
        title: `Retorno vencido: ${lead.name}`,
        description: `O retorno estava previsto para ${new Date(nextContact).toLocaleString("pt-BR")}.`,
        entityType: "lead",
        entityId: lead.id,
        dueAt: new Date(nextContact).toISOString(),
      });
      continue;
    }

    const reference = dateMs(lead.lastContactAt) ?? dateMs(lead.updatedAt) ?? dateMs(lead.createdAt);
    if (reference !== null) {
      const inactivity = daysBetween(reference, current);
      if (inactivity >= 5) {
        alerts.push({
          id: `lead-inactive-${lead.id}`,
          type: "lead_inactive",
          severity: inactivity >= 10 ? "critical" : "warning",
          title: `Cliente sem contato: ${lead.name}`,
          description: `${inactivity} dias sem atualização ou contato registrado.`,
          entityType: "lead",
          entityId: lead.id,
          dueAt: new Date(reference).toISOString(),
        });
      }
    }
  }

  for (const sale of sales) {
    const invoiceExpected = dateMs(sale.invoiceExpectedAt);
    if (invoiceExpected !== null && !sale.invoiceIssuedAt && !["cancelled", "received"].includes(sale.status)) {
      const days = daysBetween(current, invoiceExpected);
      if (days <= 3) {
        alerts.push({
          id: `invoice-${sale.id}`,
          type: "invoice_due",
          severity: days < 0 ? "critical" : "warning",
          title: `${days < 0 ? "Nota fiscal atrasada" : "Nota fiscal próxima"}: ${sale.clientName}`,
          description: days < 0 ? `A emissão está atrasada há ${Math.abs(days)} dia(s).` : `Emissão prevista em ${days} dia(s).`,
          entityType: "sale",
          entityId: sale.id,
          dueAt: new Date(invoiceExpected).toISOString(),
        });
      }
    }

    sale.installments.forEach((installment) => {
      if (["received", "cancelled"].includes(installment.status)) return;
      const expected = dateMs(installment.expectedAt);
      if (expected === null) return;
      const days = daysBetween(current, expected);
      if (days <= 5) {
        alerts.push({
          id: `payment-${sale.id}-${installment.id}`,
          type: days < 0 ? "payment_overdue" : "payment_due",
          severity: days < 0 ? "critical" : "warning",
          title: `${days < 0 ? "Recebimento atrasado" : "Recebimento próximo"}: ${sale.clientName}`,
          description: `${installment.description} · R$ ${installment.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}.`,
          entityType: "sale",
          entityId: sale.id,
          dueAt: new Date(expected).toISOString(),
        });
      }
    });
  }

  const severityOrder = { critical: 0, warning: 1, info: 2 } as const;
  return alerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity] || a.dueAt.localeCompare(b.dueAt));
}
