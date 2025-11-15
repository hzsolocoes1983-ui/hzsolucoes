# Guia de Deploy

Este projeto é um monorepo com dois aplicativos:
- **Backend** (`apps/server`): API Express com tRPC - deploy no **Railway**
- **Frontend** (`apps/web`): App React com Vite - deploy no **Vercel**

## 🚂 Deploy no Railway (Backend)

### Opção 1: Usando GitHub (Recomendado)

1. Acesse [Railway](https://railway.app) e faça login
2. Clique em "New Project"
3. Selecione "Deploy from GitHub repo"
4. Escolha o repositório `hzbkps-spec/hzsolucoes`
5. Configure o projeto:
   - **Root Directory**: `hz-solucoes/apps/server`
   - **Build Command**: `npm run build`
   - **Start Command**: `npm start`
   - **Port**: Railway detecta automaticamente (use a variável `PORT`)

### Opção 2: Usando Dockerfile

O Railway detectará automaticamente o `Dockerfile` em `apps/server/` se você configurar o root directory corretamente.

### Variáveis de Ambiente no Railway

Configure as seguintes variáveis de ambiente no Railway:
- `PORT`: Porta do servidor (Railway define automaticamente, mas você pode sobrescrever)
- `CORS_ORIGIN`: URL do frontend no Vercel (ex: `https://seu-app.vercel.app`) - opcional, padrão permite todas as origens
- Adicione outras variáveis conforme necessário (ex: banco de dados, API keys)

### Após o Deploy

Anote a URL do seu backend no Railway (ex: `https://seu-app.railway.app`)

---

## ▲ Deploy no Vercel (Frontend)

### Passo a Passo

1. Acesse [Vercel](https://vercel.com) e faça login
2. Clique em "Add New Project"
3. Importe o repositório `hzbkps-spec/hzsolucoes`
4. Configure o projeto:
   - **Framework Preset**: Vite
   - **Root Directory**: `hz-solucoes/apps/web`
   - **Build Command**: `npm run build` (já configurado no vercel.json)
   - **Output Directory**: `dist` (já configurado no vercel.json)

### Variáveis de Ambiente no Vercel

**IMPORTANTE**: Configure a variável de ambiente:

- `VITE_TRPC_URL`: URL completa do seu backend no Railway
  - Exemplo: `https://seu-app.railway.app/trpc`
  - **Sem esta variável, o frontend não conseguirá se conectar ao backend!**

### Após o Deploy

O Vercel fornecerá uma URL para seu frontend (ex: `https://seu-app.vercel.app`)

---

## ✅ Checklist de Deploy

- [ ] Backend deployado no Railway
- [ ] URL do backend anotada
- [ ] Frontend deployado no Vercel
- [ ] Variável `VITE_TRPC_URL` configurada no Vercel apontando para o Railway
- [ ] Testar conexão entre frontend e backend
- [ ] Verificar se CORS está configurado corretamente no backend

---

## 🔧 Troubleshooting

### Frontend não consegue conectar ao backend

1. Verifique se `VITE_TRPC_URL` está configurada corretamente no Vercel
2. Verifique se o backend está rodando no Railway
3. Verifique se o CORS está habilitado no backend (já está no código)
4. A URL deve terminar com `/trpc` (ex: `https://backend.railway.app/trpc`)

### Erro de build no Railway

- Verifique se o Root Directory está configurado como `hz-solucoes/apps/server`
- Verifique se todas as dependências estão no `package.json`

### Erro de build no Vercel

- Verifique se o Root Directory está configurado como `hz-solucoes/apps/web`
- Verifique se o `vercel.json` está no diretório correto

