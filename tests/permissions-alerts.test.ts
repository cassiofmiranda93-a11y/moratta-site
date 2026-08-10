import assert from "node:assert/strict";
import test from "node:test";
import { buildCrmAlerts, crmAlertOccurrenceId, filterOpenCrmAlerts } from "../src/lib/crmAlerts.ts";
import { hasPermission } from "../src/lib/permissions.ts";
import type { SaleRecord, WebsiteLeadRecord } from "../src/types/admin.ts";

function lead(overrides: Partial<WebsiteLeadRecord> = {}): WebsiteLeadRecord {
  return {
    id: "lead-1", name: "Cliente", phone: "51999999999", email: "", city: "Gravataí",
    propertyInterest: "Campo Belo", developmentId: "", propertyId: "", assignedTo: "broker-1",
    stage: "contacted", source: "manual", campaign: "", utmSource: "", income: 0, fgts: 0,
    notes: "", nextContactAt: null, lastContactAt: "2026-07-20T12:00:00.000Z",
    createdAt: "2026-07-20T12:00:00.000Z", updatedAt: "2026-07-20T12:00:00.000Z", ...overrides,
  };
}

function sale(overrides: Partial<SaleRecord> = {}): SaleRecord {
  return {
    id: "sale-1", leadId: "lead-1", clientName: "Cliente", brokerId: "broker-1", developmentId: "campo-belo",
    propertyId: "u1", saleDate: "2026-07-20", propertyValue: 250000, commissionPercent: 0.06,
    commissionValue: 15000, payerName: "Construtora", invoiceExpectedAt: "2026-07-27", invoiceIssuedAt: "",
    invoiceNumber: "", status: "awaiting_invoice", notes: "", installments: [{ id: "p1", description: "Parcela 1",
      amount: 15000, expectedAt: "2026-07-27", receivedAt: "", receivedAmount: 0, status: "pending" }],
    createdAt: null, updatedAt: null, ...overrides,
  };
}

test("corretor não recebe permissões administrativas", () => {
  assert.equal(hasPermission("broker", "manage_integrations"), false);
  assert.equal(hasPermission("broker", "view_leads"), true);
  assert.equal(hasPermission("admin", "manage_security"), true);
});

test("gera alertas comerciais e financeiros vencidos", () => {
  const alerts = buildCrmAlerts([lead({ nextContactAt: "2026-07-27T10:00:00.000Z" })], [sale()], new Date("2026-07-28T12:00:00.000Z"));
  assert.ok(alerts.some((item) => item.type === "lead_return"));
  assert.ok(alerts.some((item) => item.type === "invoice_due"));
  assert.ok(alerts.some((item) => item.type === "payment_overdue"));
});

test("alerta finalizado some apenas para a mesma ocorrência", () => {
  const [alert] = buildCrmAlerts(
    [lead({ nextContactAt: "2026-07-27T10:00:00.000Z" })],
    [],
    new Date("2026-07-28T12:00:00.000Z"),
  );
  const occurrenceId = crmAlertOccurrenceId(alert);
  assert.equal(filterOpenCrmAlerts([alert], [occurrenceId]).length, 0);

  const futureOccurrence = { ...alert, dueAt: "2026-08-03T10:00:00.000Z" };
  assert.notEqual(crmAlertOccurrenceId(futureOccurrence), occurrenceId);
  assert.equal(filterOpenCrmAlerts([futureOccurrence], [occurrenceId]).length, 1);
});
