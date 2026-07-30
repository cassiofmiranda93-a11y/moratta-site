import type { AtlasLeadAssessment, WebsiteLeadRecord } from "@/types/admin";

const WON_STAGES = new Set(["contract", "won"]);
const LOST_STAGES = new Set(["lost"]);
const ADVANCED_STAGES = new Set(["approved", "visit", "proposal", "reserved", "contract", "won"]);

function daysSince(value: string | null, now: Date) {
  if (!value) return 999;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 999;
  return Math.max(0, Math.floor((now.getTime() - date.getTime()) / 86_400_000));
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function assessLead(lead: WebsiteLeadRecord, now = new Date()): AtlasLeadAssessment {
  let score = 20;
  const reasons: string[] = [];
  const alerts: string[] = [];
  const inactivityDays = daysSince(lead.lastContactAt ?? lead.updatedAt ?? lead.createdAt, now);

  if (lead.phone) {
    score += 8;
    reasons.push("WhatsApp informado");
  }
  if (lead.email) score += 4;
  if (lead.city) score += 4;
  if (lead.propertyInterest) {
    score += 10;
    reasons.push("Interesse definido");
  }
  if (lead.income > 0) {
    score += 12;
    reasons.push("Renda cadastrada");
  }
  if (lead.fgts > 0) {
    score += 6;
    reasons.push("FGTS informado");
  }
  if (lead.assignedTo) score += 5;
  else alerts.push("Lead ainda sem corretor responsável");

  const stageBoost: Record<string, number> = {
    new: 0,
    contacted: 7,
    documents: 14,
    credit_analysis: 20,
    approved: 30,
    visit: 34,
    proposal: 42,
    reserved: 50,
    contract: 58,
    won: 65,
    lost: -50,
  };
  score += stageBoost[lead.stage] ?? 0;

  if (ADVANCED_STAGES.has(lead.stage)) reasons.push("Etapa avançada do funil");
  if (inactivityDays >= 7 && !WON_STAGES.has(lead.stage) && !LOST_STAGES.has(lead.stage)) {
    score -= 18;
    alerts.push(`Sem movimentação há ${inactivityDays} dias`);
  } else if (inactivityDays >= 3 && !WON_STAGES.has(lead.stage) && !LOST_STAGES.has(lead.stage)) {
    score -= 8;
    alerts.push(`Sem movimentação há ${inactivityDays} dias`);
  }

  if (lead.nextContactAt) {
    const due = new Date(lead.nextContactAt);
    if (!Number.isNaN(due.getTime()) && due < now && !WON_STAGES.has(lead.stage) && !LOST_STAGES.has(lead.stage)) {
      score += 5;
      alerts.push("Retorno vencido");
    }
  }

  score = clamp(Math.round(score), 0, 100);
  const probability = WON_STAGES.has(lead.stage) ? 100 : LOST_STAGES.has(lead.stage) ? 0 : clamp(Math.round(score * 0.88), 5, 92);
  const priority = score >= 80 ? "critical" : score >= 62 ? "high" : score >= 40 ? "medium" : "low";

  let nextAction = "Realizar primeiro contato e confirmar interesse, renda e cidade.";
  if (!lead.assignedTo) nextAction = "Definir um corretor responsável antes do próximo contato.";
  else if (alerts.includes("Retorno vencido")) nextAction = "Retomar o contato hoje e registrar o resultado no histórico.";
  else if (lead.stage === "documents") nextAction = "Conferir a documentação pendente e organizar o envio para análise.";
  else if (lead.stage === "credit_analysis") nextAction = "Acompanhar o retorno da análise de crédito e atualizar o cliente.";
  else if (lead.stage === "approved") nextAction = "Apresentar as melhores unidades e agendar visita ou reunião.";
  else if (lead.stage === "visit") nextAction = "Fazer o pós-visita, tratar objeções e encaminhar proposta.";
  else if (lead.stage === "proposal") nextAction = "Acompanhar a proposta e buscar a decisão do cliente.";
  else if (lead.stage === "reserved") nextAction = "Conferir documentos, prazos da reserva e preparar contrato.";
  else if (lead.stage === "contract") nextAction = "Confirmar assinatura, comissão e previsão de emissão da nota fiscal.";
  else if (lead.stage === "won") nextAction = "Registrar nota fiscal, parcelas e datas previstas de recebimento.";
  else if (lead.stage === "lost") nextAction = "Registrar o motivo da perda e programar eventual reativação.";
  else if (inactivityDays >= 3) nextAction = "Reativar o lead com mensagem objetiva e nova opção de imóvel.";

  const recommendedDevelopment = lead.propertyInterest || (lead.city ? `Empreendimento compatível com ${lead.city}` : "Definir após qualificação");
  const suggestedWhatsapp = `Olá, ${lead.name || "tudo bem"}! Aqui é da Moratta Imóveis. Estou acompanhando seu interesse em ${lead.propertyInterest || "um imóvel"}. Posso te atualizar sobre as melhores condições e os próximos passos?`;
  const suggestedCallScript = `Confirmar o interesse de ${lead.name || "cliente"}, validar renda e forma de entrada, entender prazo para compra, apresentar a opção mais compatível e combinar uma próxima ação com data definida.`;

  return {
    score,
    probability,
    priority,
    inactivityDays,
    reasons: reasons.slice(0, 5),
    alerts,
    nextAction,
    recommendedDevelopment,
    suggestedWhatsapp,
    suggestedCallScript,
  };
}

export function priorityLabel(priority: AtlasLeadAssessment["priority"]) {
  return {
    critical: "Urgente",
    high: "Alta",
    medium: "Média",
    low: "Baixa",
  }[priority];
}
