# Moratta Site 1.0 — Catálogo e Administração

## Entrega

- Catálogo dinâmico no Firestore.
- Página `/empreendimentos` com filtros.
- Página individual de cada empreendimento.
- Formulário de interesse integrado à coleção comercial da organização Moratta.
- Captura de UTMs, campanha, conjunto e anúncio.
- Área `/admin` com login Google.
- Cadastro e edição de empreendimentos.
- Upload de capa e galeria no Firebase Storage.
- Cadastro de unidades e imóveis usados.
- Controle de preço, comissão, disponibilidade, reserva e venda.
- Catálogo inicial com Campo Belo e Parque Mirante.
- WhatsApp e imagens padronizados.
- Metadata, idioma e estrutura SEO corrigidos.

## Estrutura compartilhada com o Atlas

```text
organizations/moratta/developments
organizations/moratta/properties
organizations/moratta/leads
```

O Atlas 1.7 continua funcionando em sua coleção pessoal. Uma atualização conectora deve passar a ler a coleção organizacional e migrar os leads existentes.

## Segurança desta versão

- Visitantes só leem empreendimentos publicados.
- Visitantes podem criar um lead inicial validado.
- Usuários autenticados gerenciam catálogo e CRM.
- Upload limitado a imagens de até 10 MB.

Antes de abrir o painel para uma equipe maior, criar controle de funções por `members/{uid}` e ativar Firebase App Check.
