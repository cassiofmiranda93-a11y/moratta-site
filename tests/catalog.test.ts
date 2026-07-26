import test from "node:test";
import assert from "node:assert/strict";
import {
  createSlug,
  filterDevelopments,
  formatCurrency,
  normalizePhone,
  parseList,
  toNullableNumber,
} from "../src/lib/catalog.ts";
import { PROJECTS } from "../src/data/projects.ts";

test("cria slug sem acentos", () => {
  assert.equal(createSlug("Parque Itália – Gravataí"), "parque-italia-gravatai");
});

test("normaliza telefone", () => {
  assert.equal(normalizePhone("(51) 99659-4956"), "51996594956");
});

test("remove itens repetidos de listas", () => {
  assert.deepEqual(parseList("Caixa\nFGTS\nCaixa"), ["Caixa", "FGTS"]);
});

test("converte números vazios para null", () => {
  assert.equal(toNullableNumber(""), null);
  assert.equal(toNullableNumber("42,5"), 42.5);
});

test("formata valores em real", () => {
  assert.match(formatCurrency(250000), /R\$\s?250\.000/);
});

test("filtra catálogo", () => {
  assert.equal(filterDevelopments(PROJECTS, "campo", "", "").length, 1);
  assert.equal(filterDevelopments(PROJECTS, "", "Gravataí", "Casas").length, 1);
});
