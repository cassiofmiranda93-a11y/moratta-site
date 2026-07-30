# Moratta Site 1.2 — CRM Comercial

## Entregue nesta versão

### Corretores
- criação e edição;
- ativação e desativação na roleta;
- exclusão com confirmação;
- liberação automática dos leads vinculados ao corretor excluído;
- prevenção de e-mail duplicado.

### Roleta de leads
- distribuição round-robin entre corretores ativos;
- persistência do último corretor utilizado em `settings/leadDistribution`;
- distribuição em lote dos leads sem responsável;
- corretores inativos são ignorados;
- atribuição manual continua disponível.

### Kanban
- visualização Kanban e tabela;
- movimentação por arrastar e soltar;
- etapas comerciais completas, incluindo venda e perdido;
- WhatsApp, telefone e responsável diretamente no card;
- pesquisa por cliente, telefone, cidade, interesse e campanha.

## Validação executada
- testes automatizados: 6 aprovados;
- TypeScript: aprovado com `--allowImportingTsExtensions`;
- o build completo não pôde baixar o pacote SWC Linux no ambiente de geração (erro externo 503). O pacote deve ser validado normalmente no Windows com `npm run build`.

## Instalação
1. Extraia o ZIP sobre uma cópia do projeto.
2. Preserve o seu arquivo `.env.local` atual — ele não está incluído por segurança.
3. Execute `npm install`.
4. Execute `npm run test`.
5. Execute `npm run build`.
6. Publique as regras: `firebase deploy --only firestore:rules`.
7. Faça commit e push para a Vercel.
