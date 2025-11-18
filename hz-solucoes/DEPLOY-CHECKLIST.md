# Checklist de Deploy (Web + Server)

Este checklist orienta a publicação do frontend (Vite/React) e backend (Express/tRPC/Drizzle) em ambientes como Vercel/Netlify e servidores próprios.

## Pré-requisitos
- Node.js 18+.
- Banco: `DATABASE_URL` (SQLite local `file:./local.db` ou Turso), opcional `DATABASE_AUTH_TOKEN` (Turso).
- WhatsApp Cloud API (opcional): `META_VERIFY_TOKEN`, `META_ACCESS_TOKEN`, `META_PHONE_ID`.

## Backend (apps/server)
- Variáveis:
  - `PORT`: porta do servidor (padrão `3000`).
  - `CORS_ORIGIN`: origem permitida para o frontend (ex.: `https://seu-dominio.com`). Em dev pode usar `http://localhost:5173`.
  - `DATABASE_URL` e `DATABASE_AUTH_TOKEN` conforme seu banco.
- Build/Run:
  - Dev: `npm run dev`.
  - Produção: `npm run build` e `npm run start`.
- Saúde:
  - `GET /whatsapp/webhook?hub.challenge=123` responde desafio (se habilitado em dev).
  - `POST /whatsapp/webhook` processa comandos simples (`gasto`, `receita`, `saldo`, `despesas`).
- Segurança:
  - Ajuste `CORS_ORIGIN` para o domínio do frontend.
  - Considere tokens JWT no futuro em vez de tokens simples.

## Frontend (apps/web)
- Variáveis:
  - `VITE_TRPC_URL`: URL completa do endpoint tRPC em produção (ex.: `https://api.seu-dominio.com/trpc`). Em dev use proxy (`/trpc`).
- Dev:
  - `npm run dev` (Vite) com proxy para `http://localhost:3000` já configurado.
- Build/Preview:
  - `npm run build` e `npm run preview`.
  - Em preview, sem proxy, defina `VITE_TRPC_URL` (ex.: `http://localhost:3000/trpc`) para evitar erro 500 no login.
- Deploy SPA:
  - Vercel: `vercel.json` com `outputDirectory` e rewrites para `index.html`.
  - Netlify: `netlify.toml` com `[[redirects]]` para SPA e headers.

## Testes e Validações
- Backend: `node apps/server/test-all.js` valida login, transações, metas, itens, água e cuidados diários.
- Frontend: validar manualmente login convidado e navegação para `/dashboard`, `/transactions`, `/reports`, `/items`, `/goals`.
- WhatsApp: simular webhook com payloads de exemplo.

## Pós-deploy
- Monitorar logs do servidor e erros tRPC/Zod.
- Verificar índices e cache conforme melhorias de performance.
- Confirmar que `VITE_TRPC_URL` e `CORS_ORIGIN` apontam para os domínios corretos.