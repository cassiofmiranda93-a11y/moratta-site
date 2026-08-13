# Moratta 5.4 — privacidade, bolsão de perdidos e distribuição em lotes

## O que mudou

- Os rankings de corretores, inclusive o ranking por receita, aparecem somente para administradores.
- Corretores consultam apenas a própria carteira e não recebem contagens de leads dos colegas.
- Leads marcados como `Perdido` saem da carteira e entram no novo **Bolsão de perdidos**.
- O bolsão aparece somente para administradores e permite devolver o lead ao funil como `Novo`, sem responsável.
- A tela de clientes permite distribuir os primeiros 20, 40, 60, 80 ou 100 leads sem responsável do filtro atual.
- A distribuição em lote carrega a base uma única vez por lote e continua respeitando disponibilidade, limite diário, cidade, especialidade e o modo de roleta configurado.

## Proteções

- As regras do Firestore bloqueiam a leitura de leads de colegas por contas de corretor.
- Leads perdidos também são bloqueados para corretores no Firestore, não apenas escondidos na interface.
- Alertas finalizados de um corretor ficam restritos ao próprio corretor.
- Um índice do Firestore foi incluído para a consulta segura da carteira.
- A versão V3 inclui o motor de alertas completo para compatibilidade com a base instalada após a Moratta 5.3.

## Validação

- 28 testes automatizados aprovados.
- ESLint sem erros.
- TypeScript sem erros.
- Build de produção do Next.js aprovado.

## Publicação

Além do deploy automático da Vercel, esta versão exige a publicação de `firestore.rules` e `firestore.indexes.json` no projeto Firebase `atlas-ai-83f0d`.
