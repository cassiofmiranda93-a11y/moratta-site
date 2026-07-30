# Moratta Site 2.0 — CRM Sprints 1 a 4

## Entregas

- Dashboard executivo com KPIs, funil, origens, ranking e alertas.
- Perfil completo do lead com renda, FGTS, observações, retorno e histórico.
- Atividades por lead: observação, ligação, WhatsApp, visita, documento e tarefa.
- Gestão de corretores compatível com disponibilidade, limite diário, cidades e especialidades.
- Distribuição round robin ou por menor carteira, com regras configuráveis.
- Painel de preparação para Meta Lead Ads e WhatsApp.
- Configurações persistidas no Firestore.

## Limite importante das integrações

O painel e a estrutura de dados estão prontos. Meta Lead Ads e automações do WhatsApp ainda exigem credenciais oficiais e rotas server-side seguras. Tokens secretos não devem ser salvos no código do navegador.

## Instalação

Execute `INSTALAR-MORATTA-SITE-2.0.ps1` na pasta do projeto ou copie os arquivos do pacote sobre o projeto atual. Depois rode:

```powershell
npm install
npm run build
firebase deploy --only firestore:rules
npm run dev
```
