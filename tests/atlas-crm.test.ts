import assert from "node:assert/strict";
import test from "node:test";
import { assessLead } from "../src/lib/atlasCrm.ts";
import type { WebsiteLeadRecord } from "../src/types/admin.ts";

function lead(overrides: Partial<WebsiteLeadRecord> = {}): WebsiteLeadRecord {
  return {
    id: "lead-1",
    name: "Cliente Teste",
    phone: "51999999999",
    email: "cliente@teste.com",
    city: "Gravataí",
    propertyInterest: "Campo Belo",
    developmentId: "",
    propertyId: "",
    assignedTo: "corretor-1",
    stage: "new",
    source: "site",
    campaign: "",
    utmSource: "",
    income: 0,
    fgts: 0,
    notes: "",
    nextContactAt: null,
    lastContactAt: "2026-07-28T12:00:00.000Z",
    createdAt: "2026-07-28T12:00:00.000Z",
    updatedAt: "2026-07-28T12:00:00.000Z",
    ...overrides,
  };
}

test("lead avançado recebe pontuação maior", () => {
  const now = new Date("2026-07-28T18:00:00.000Z");
  const basic = assessLead(lead(), now);
  const advanced = assessLead(lead({ stage: "proposal", income: 4500, fgts: 12000 }), now);
  assert.ok(advanced.score > basic.score);
  assert.ok(advanced.probability > basic.probability);
});

test("retorno vencido gera alerta", () => {
  const assessment = assessLead(lead({ nextContactAt: "2026-07-27T10:00:00.000Z" }), new Date("2026-07-28T18:00:00.000Z"));
  assert.ok(assessment.alerts.includes("Retorno vencido"));
});
