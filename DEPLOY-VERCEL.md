# Guia de Deploy no Vercel

## 📋 Pré-requisitos

1. Conta no [Vercel](https://vercel.com)
2. Repositório no GitHub já configurado
3. Node.js 20.x ou superior

## 🚀 Deploy Passo a Passo

### Opção 1: Deploy via Interface Web (Recomendado)

1. **Acesse o Vercel**: https://vercel.com
2. **Faça login** com sua conta GitHub
3. **Clique em "Add New Project"**
4. **Importe o repositório** `hzsolocoes1983-ui/hzsolucoas`
5. **Configure o projeto**:
   - **Framework Preset**: Vite
   - **Root Directory**: Deixe vazio (raiz do projeto)
   - **Build Command**: `cd hz-solucoes/apps/web && npm install && npm run build`
   - **Output Directory**: `hz-solucoes/apps/web/dist`
   - **Install Command**: `cd hz-solucoes/apps/web && npm install`

### Opção 2: Deploy via CLI

```bash
# Instalar Vercel CLI
npm i -g vercel

# Fazer login
vercel login

# Deploy (na raiz do projeto)
vercel

# Deploy para produção
vercel --prod
```

## 🔧 Variáveis de Ambiente

Configure as seguintes variáveis no Vercel (Settings → Environment Variables):

### Banco de Dados
- `DATABASE_URL`: URL do banco Turso (ex: `libsql://seu-banco.turso.io`)
- `DATABASE_AUTH_TOKEN`: Token de autenticação do Turso

### WhatsApp (Opcional)
- `WHATSAPP_PHONE_ID`: ID do número WhatsApp Business
- `WHATSAPP_ACCESS_TOKEN`: Token de acesso da API
- `WHATSAPP_VERIFY_TOKEN`: Token de verificação do webhook
- `WHATSAPP_API_VERSION`: Versão da API (padrão: `v20.0`)

### CORS
- `CORS_ORIGIN`: URL do frontend (opcional, padrão permite todas)

### Usuário Padrão
- `DEFAULT_WHATSAPP`: WhatsApp padrão para login guest (padrão: `family@local`)
- `DEFAULT_NAME`: Nome do usuário padrão (padrão: `Família`)

### Frontend (Opcional)
- `VITE_TRPC_URL`: URL da API tRPC (se diferente de `/trpc`)

## 📁 Estrutura do Projeto no Vercel

```
/
├── vercel.json (configuração principal)
├── hz-solucoes/
│   ├── apps/
│   │   ├── web/          (Frontend - build estático)
│   │   └── server/
│   │       └── api/      (Serverless Functions)
│   │           ├── trpc.ts
│   │           ├── whatsapp.ts
│   │           └── health.ts
```

## 🔍 Rotas Configuradas

- `/trpc/*` → API tRPC (serverless function)
- `/whatsapp/*` → Webhook WhatsApp (serverless function)
- `/health` → Health check (serverless function)
- `/*` → Frontend React (arquivos estáticos)

## ⚠️ Problemas Comuns e Soluções

### 1. Erro: "Module not found"
**Solução**: Verifique se os imports estão usando paths relativos corretos:
- `../src/routes/trpc.js` (não `.ts`)
- `../src/db/migrate.js` (não `.ts`)

### 2. Erro: "Database connection failed"
**Solução**: 
- Verifique se `DATABASE_URL` e `DATABASE_AUTH_TOKEN` estão configurados
- Use banco Turso (libSQL) para produção, não arquivo local

### 3. Frontend não carrega
**Solução**:
- Verifique se o build foi executado: `cd hz-solucoes/apps/web && npm run build`
- Confirme que `outputDirectory` está correto no `vercel.json`

### 4. API retorna 404
**Solução**:
- Verifique se os arquivos em `hz-solucoes/apps/server/api/` existem
- Confirme que as rotas no `vercel.json` estão corretas

### 5. Erro de CORS
**Solução**:
- Configure `CORS_ORIGIN` com a URL do seu frontend
- Ou deixe `*` para desenvolvimento (não recomendado para produção)

## 🧪 Testar Localmente

```bash
# Instalar dependências do frontend
cd hz-solucoes/apps/web
npm install

# Build do frontend
npm run build

# Testar com Vercel CLI
vercel dev
```

## 📝 Checklist de Deploy

- [ ] Repositório no GitHub está atualizado
- [ ] Variáveis de ambiente configuradas no Vercel
- [ ] Build do frontend funciona localmente
- [ ] Banco de dados Turso configurado
- [ ] Webhook do WhatsApp configurado (se aplicável)
- [ ] Deploy realizado com sucesso
- [ ] Testar rotas da API (`/health`, `/trpc/*`)
- [ ] Testar frontend carregando corretamente
- [ ] Verificar logs no Vercel para erros

## 🔗 URLs Após Deploy

Após o deploy, você terá:
- **Frontend + API**: `https://seu-projeto.vercel.app`
- **Health Check**: `https://seu-projeto.vercel.app/health`
- **tRPC API**: `https://seu-projeto.vercel.app/trpc/*`
- **WhatsApp Webhook**: `https://seu-projeto.vercel.app/whatsapp/webhook`

## 📚 Recursos Adicionais

- [Documentação Vercel](https://vercel.com/docs)
- [Vercel Serverless Functions](https://vercel.com/docs/functions)
- [Turso Database](https://turso.tech)


