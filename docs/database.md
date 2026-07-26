# Banco de dados compartilhado

O site e o Atlas usam o mesmo projeto Firebase e a organização `moratta`.

```text
organizations/moratta
├── developments   # empreendimentos
├── properties     # unidades e imóveis usados
├── leads          # leads recebidos pelo site e CRM
├── settings       # configurações do site
└── members        # equipe e permissões futuras
```

## Compatibilidade

O site grava leads com os mesmos campos usados pelo CRM Atlas 1.7: `name`, `phone`, `source`, `stage`, `propertyInterest`, UTMs, follow-up, tags e status.

O Atlas 1.7 ainda consulta `users/{uid}/crmLeads`. A atualização de conexão deve passar a consultar `organizations/moratta/leads`, preservando a coleção antiga durante a migração.
