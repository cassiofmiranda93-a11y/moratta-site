import assert from "node:assert/strict";
import test from "node:test";
import { buildCrmImportPreview, normalizePhone, parseMoney, parsePercent } from "../src/lib/crmImport.ts";

test("normaliza telefone brasileiro", () => {
  assert.equal(normalizePhone("+55 (51) 99999-9999"), "51999999999");
});

test("interpreta valores em formato brasileiro", () => {
  assert.equal(parseMoney("R$ 12.345,67"), 12345.67);
  assert.equal(parsePercent("6%"), 0.06);
});

test("monta prévia de clientes e vendas", () => {
  const preview = buildCrmImportPreview([
    {
      __rowNumber: 5,
      "Nome completo *": "Cliente Teste",
      "WhatsApp com DDD *": "51999999999",
      "Etapa atual *": "Análise de crédito",
      "Origem do lead": "Carteira antiga",
      "Renda familiar mensal": "R$ 4.500,00",
    },
  ], [
    {
      __rowNumber: 5,
      "WhatsApp do cliente *": "51999999999",
      "Nome do cliente *": "Cliente Teste",
      "Valor do imóvel": "R$ 200.000,00",
      "Comissão %": "6%",
      "Valor previsto da parcela": "R$ 12.000,00",
      "Status da venda": "Venda confirmada",
      "Status da parcela": "Pendente",
    },
  ]);

  assert.equal(preview.issues.length, 0);
  assert.equal(preview.leads[0].lead.stage, "credit_analysis");
  assert.equal(preview.leads[0].lead.income, 4500);
  assert.equal(preview.sales[0].sale.commissionValue, 12000);
});

test("detecta telefone inválido e repetido", () => {
  const preview = buildCrmImportPreview([
    { "Nome completo *": "A", "WhatsApp com DDD *": "123", "Etapa atual *": "Novo lead" },
    { "Nome completo *": "Cliente Dois", "WhatsApp com DDD *": "123", "Etapa atual *": "Novo lead" },
  ]);
  assert.ok(preview.issues.length >= 3);
});
