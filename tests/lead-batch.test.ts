import assert from "node:assert/strict";
import test from "node:test";

import {
  LEAD_DISTRIBUTION_BATCH_SIZES,
  selectUnassignedLeadIds,
} from "../src/lib/lead-batch.ts";

test("oferece os tamanhos de lote definidos para a distribuição", () => {
  assert.deepEqual(LEAD_DISTRIBUTION_BATCH_SIZES, [20, 40, 60, 80, 100]);
});

test("seleciona o lote na ordem do filtro e somente entre leads sem responsável", () => {
  const leads = [
    { id: "lead-1", assignedTo: "", stage: "new" },
    { id: "lead-2", assignedTo: "broker-1", stage: "new" },
    { id: "lead-3", assignedTo: "", stage: "lost" },
    { id: "lead-4", assignedTo: "", stage: "contacted" },
  ];

  assert.deepEqual(selectUnassignedLeadIds(leads, 2), ["lead-1", "lead-4"]);
});

test("limita o lote à quantidade solicitada", () => {
  const leads = Array.from({ length: 120 }, (_, index) => ({
    id: `lead-${index + 1}`,
    assignedTo: "",
    stage: "new",
  }));

  assert.equal(selectUnassignedLeadIds(leads, 40).length, 40);
  assert.equal(selectUnassignedLeadIds(leads, 100).length, 100);
});
