# Moratta Imóveis

Site institucional e catálogo comercial integrado ao Firebase e preparado para o CRM Atlas.

## Desenvolvimento

```bash
npm install
npm run dev
```

- Site: `http://localhost:3000`
- Catálogo: `http://localhost:3000/empreendimentos`
- Administração: `http://localhost:3000/admin`

## Firebase

Use o mesmo projeto do Atlas e copie `.env.example` para `.env.local`.

Publique:

```bash
firebase deploy --only firestore:rules,storage --project atlas-ai-83f0d
```

## Validação

```bash
npm test
npm run lint
npm run build
```
