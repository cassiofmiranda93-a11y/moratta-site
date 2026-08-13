import assert from "node:assert/strict";
import test from "node:test";
import {
  buildCrmAlerts,
  crmAlertOccurrenceId,
  filterCrmAlertsByBroker,
  filterOpenCrmAlerts,
} from "../src/lib/crmAlerts.ts";
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

test("somente administrador pode visualizar rankings de corretores", () => {
  assert.equal(hasPermission("admin", "view_broker_ranking"), true);
  assert.equal(hasPermission("manager", "view_broker_ranking"), false);
  assert.equal(hasPermission("broker", "view_broker_ranking"), false);
  assert.equal(hasPermission("finance", "view_broker_ranking"), false);
});

test("somente administrador pode acessar o bolsao de leads perdidos", () => {
  assert.equal(hasPermission("admin", "view_lost_leads_pool"), true);
  assert.equal(hasPermission("manager", "view_lost_leads_pool"), false);
  assert.equal(hasPermission("broker", "view_lost_leads_pool"), false);
  assert.equal(hasPermission("finance", "view_lost_leads_pool"), false);
});

test("gera alertas comerciais e financeiros vencidos", () => {
  const alerts = buildCrmAlerts([lead({ nextContactAt: "2026-07-27T10:00:00.000Z" })], [sale()], new Date("2026-07-28T12:00:00.000Z"));
  assert.ok(alerts.some((item) => item.type === "lead_return"));
  assert.ok(alerts.some((item) => item.type === "invoice_due"));
  assert.ok(alerts.some((item) => item.type === "payment_overdue"));
  assert.ok(alerts.every((item) => item.brokerId === "broker-1"));
});

test("filtra alertas pelo corretor e mostra pendências sem responsável", () => {
  const alerts = buildCrmAlerts(
    [
      lead({ id: "lead-1", assignedTo: "broker-1", nextContactAt: "2026-07-27T10:00:00.000Z" }),
      lead({ id: "lead-2", assignedTo: "", lastContactAt: "2026-07-10T10:00:00.000Z" }),
    ],
    [],
    new Date("2026-07-28T12:00:00.000Z"),
  );

  assert.equal(filterCrmAlertsByBroker(alerts, "broker-1").length, 1);
  assert.equal(filterCrmAlertsByBroker(alerts, "__unassigned__").length, 1);
  assert.equal(filterCrmAlertsByBroker(alerts, "").length, 2);
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

test("nao gera alerta de cliente sem contato para lead importado de planilha", () => {
  const alerts = buildCrmAlerts(
    [
      lead({
        id: "lead-importado",
        stage: "new",
        lastContactAt: null,
        importedAt: "2026-07-20T12:00:00.000Z",
        createdAt: "2026-07-20T12:00:00.000Z",
        updatedAt: "2026-07-20T12:00:00.000Z",
      }),
      lead({
        id: "lead-manual",
        stage: "new",
        lastContactAt: null,
        importedAt: null,
        createdAt: "2026-07-20T12:00:00.000Z",
        updatedAt: "2026-07-20T12:00:00.000Z",
      }),
    ],
    [],
    new Date("2026-07-28T12:00:00.000Z"),
  );

  assert.equal(alerts.some((item) => item.type === "lead_inactive" && item.entityId === "lead-importado"), false);
  assert.equal(alerts.some((item) => item.type === "lead_inactive" && item.entityId === "lead-manual"), true);
});

test("mantem retorno vencido quando lead importado possui data de retorno", () => {
  const alerts = buildCrmAlerts(
    [lead({ importedAt: "2026-07-20T12:00:00.000Z", nextContactAt: "2026-07-27T10:00:00.000Z" })],
    [],
    new Date("2026-07-28T12:00:00.000Z"),
  );

  assert.ok(alerts.some((item) => item.type === "lead_return"));
});
