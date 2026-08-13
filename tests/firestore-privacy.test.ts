import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const rules = readFileSync(new URL("../firestore.rules", import.meta.url), "utf8");
const adminService = readFileSync(
  new URL("../src/services/adminService.ts", import.meta.url),
  "utf8",
);
const leadRules = rules.match(
  /match \/organizations\/\{organizationId\}\/leads\/\{leadId\}[\s\S]*?(?=match \/organizations\/\{organizationId\}\/sales\/\{saleId\})/,
)?.[0];

test("leitura de leads do corretor exige papel verificado e carteira própria", () => {
  assert.ok(leadRules);
  assert.match(
    leadRules,
    /allow read: if hasVerifiedRole\(organizationId, \['admin', 'manager', 'finance'\]\)[\s\S]*hasVerifiedRole\(organizationId, \['broker'\]\)[\s\S]*resource\.data\.assignedTo == memberId\(organizationId\)/,
  );
  assert.doesNotMatch(
    leadRules,
    /allow read: if[\s\S]{0,250}hasRole\(organizationId, \['broker'\]\)[\s\S]{0,150}!strictAccess\(organizationId\)/,
  );
  assert.match(
    leadRules,
    /hasVerifiedRole\(organizationId, \['broker'\]\)[\s\S]*resource\.data\.stage != 'lost'[\s\S]*resource\.data\.assignedTo == memberId\(organizationId\)/,
  );
});

test("criação aceita lead ainda sem o campo assignedTo", () => {
  assert.match(
    leadRules ?? "",
    /request\.resource\.data\.get\('assignedTo', ''\) in \['', memberId\(organizationId\)\]/,
  );
});

test("vendas e atividades também ficam limitadas à carteira do corretor", () => {
  assert.match(
    rules,
    /match \/activities\/\{activityId\}[\s\S]*allow read, create, update: if hasVerifiedRole/,
  );
  assert.match(
    rules,
    /match \/organizations\/\{organizationId\}\/sales\/\{saleId\}[\s\S]*allow read: if hasVerifiedRole/,
  );
});

test("alertas finalizados do corretor também ficam restritos ao próprio usuário", () => {
  assert.match(
    rules,
    /match \/organizations\/\{organizationId\}\/alertCompletions\/\{completionId\}[\s\S]*hasVerifiedRole\(organizationId, \['broker'\]\)[\s\S]*resource\.data\.brokerId == memberId\(organizationId\)/,
  );
});

test("consulta da carteira do corretor exclui o bolsao de perdidos", () => {
  assert.match(
    adminService,
    /where\("assignedTo", "==", assignedTo\)[\s\S]*where\("stage", "!=", "lost"\)/,
  );
});
