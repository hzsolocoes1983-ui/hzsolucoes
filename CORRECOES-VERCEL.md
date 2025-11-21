# Correções Aplicadas para Deploy no Vercel

## ✅ Arquivos Criados/Modificados

### 1. `vercel.json` (Raiz do Projeto)
Configuração principal do Vercel para monorepo:
- Build do frontend (Vite)
- Serverless functions para API
- Rotas configuradas corretamente

### 2. `package.json` (Raiz do Projeto)
Scripts auxiliares para build e instalação

### 3. `DEPLOY-VERCEL.md`
Guia completo de deploy com troubleshooting

## 🔧 Problemas Identificados e Soluções

### Problema 1: Estrutura de Monorepo
**Solução**: Criado `vercel.json` na raiz que:
- Configura build do frontend em `hz-solucoes/apps/web`
- Mapeia serverless functions em `hz-solucoes/apps/server/api`
- Define rotas corretamente

### Problema 2: Imports nos Serverless Functions
**Status**: ✅ Os imports já estão corretos usando paths relativos:
- `../src/routes/trpc.js`
- `../src/db/migrate.js`

### Problema 3: Banco de Dados
**Solução**: 
- Usa `DATABASE_URL` do ambiente (Turso em produção)
- Fallback para arquivo local apenas em desenvolvimento
- Migrations automáticas no `initDatabase()`

### Problema 4: Variáveis de Ambiente
**Solução**: Documentado em `DEPLOY-VERCEL.md`:
- `DATABASE_URL` (obrigatório)
- `DATABASE_AUTH_TOKEN` (obrigatório para Turso)
- `CORS_ORIGIN` (opcional)
- Variáveis do WhatsApp (opcionais)

## 🚀 Próximos Passos para Deploy

1. **Configurar Variáveis de Ambiente no Vercel**:
   ```
   DATABASE_URL=libsql://seu-banco.turso.io
   DATABASE_AUTH_TOKEN=seu-token-aqui
   ```

2. **Fazer Deploy**:
   - Via interface web do Vercel (recomendado)
   - Ou via CLI: `vercel --prod`

3. **Verificar Logs**:
   - Acesse o dashboard do Vercel
   - Verifique os logs de build e runtime
   - Teste as rotas: `/health`, `/trpc/*`

## ⚠️ Possíveis Erros e Soluções

### Erro: "Cannot find module"
**Causa**: Dependências não instaladas
**Solução**: 
- Verifique se `package.json` existe em `hz-solucoes/apps/server`
- O Vercel deve instalar automaticamente, mas pode precisar de configuração

### Erro: "Database connection failed"
**Causa**: Variáveis de ambiente não configuradas
**Solução**: Configure `DATABASE_URL` e `DATABASE_AUTH_TOKEN` no Vercel

### Erro: "Build failed"
**Causa**: Problemas no build do frontend
**Solução**: 
- Teste localmente: `cd hz-solucoes/apps/web && npm run build`
- Verifique erros de TypeScript/compilação

### Erro: "Function timeout"
**Causa**: Inicialização do banco demorando muito
**Solução**: 
- O `initDatabase()` já tem cache (`initialized` flag)
- Se persistir, considere usar banco pré-configurado

## 📝 Checklist Antes do Deploy

- [x] `vercel.json` criado na raiz
- [x] `package.json` criado na raiz (opcional, mas útil)
- [x] Arquivos serverless em `hz-solucoes/apps/server/api/` existem
- [ ] Variáveis de ambiente configuradas no Vercel
- [ ] Banco Turso criado e configurado
- [ ] Build do frontend testado localmente
- [ ] Repositório GitHub atualizado

## 🔍 Testar Localmente

```bash
# Instalar Vercel CLI
npm i -g vercel

# Testar localmente
vercel dev

# Isso vai:
# 1. Buildar o frontend
# 2. Servir as serverless functions
# 3. Simular o ambiente do Vercel
```

## 📚 Estrutura Final

```
/
├── vercel.json              ← Configuração do Vercel
├── package.json             ← Scripts auxiliares
├── hz-solucoes/
│   └── apps/
│       ├── web/             ← Frontend (build → dist/)
│       │   ├── package.json
│       │   ├── vite.config.ts
│       │   └── dist/        ← Output do build
│       └── server/
│           ├── api/         ← Serverless Functions
│           │   ├── trpc.ts
│           │   ├── whatsapp.ts
│           │   └── health.ts
│           ├── src/        ← Código fonte
│           └── package.json
```

## 🎯 URLs Após Deploy

- Frontend: `https://seu-projeto.vercel.app`
- API tRPC: `https://seu-projeto.vercel.app/trpc/*`
- Health: `https://seu-projeto.vercel.app/health`
- WhatsApp: `https://seu-projeto.vercel.app/whatsapp/webhook`


