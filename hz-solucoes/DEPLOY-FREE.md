# 🆓 Guia de Deploy GRATUITO

Este guia mostra como fazer deploy **100% gratuito** usando serviços com planos free generosos.

## 📊 Comparação de Planos Gratuitos

| Serviço | Backend | Frontend | Limites Gratuitos |
|---------|---------|----------|-------------------|
| **Render.com** | ✅ | ✅ | 750h/mês, sleep após 15min inativo |
| **Fly.io** | ✅ | ❌ | 3 VMs compartilhadas, 3GB storage |
| **Vercel** | ❌ | ✅ | Ilimitado (muito generoso) |
| **Netlify** | ❌ | ✅ | 100GB bandwidth/mês |
| **Cloudflare Pages** | ❌ | ✅ | Ilimitado |

## 🎯 Recomendação: Render.com (Backend) + Vercel (Frontend)

Esta é a melhor combinação gratuita:
- **Render.com**: Backend sempre disponível (pode dormir após 15min, mas acorda rápido)
- **Vercel**: Frontend com performance excelente e plano gratuito ilimitado

---

## 🚀 Opção 1: Render.com (Backend) + Vercel (Frontend) ⭐ RECOMENDADO

### Backend no Render.com

1. Acesse [Render.com](https://render.com) e faça login com GitHub
2. Clique em "New +" → "Web Service"
3. Conecte seu repositório `hzbkps-spec/hzsolucoes`
4. Configure:
   - **Name**: `hz-solucoes-backend` (ou qualquer nome)
   - **Region**: Escolha mais próximo (ex: `Oregon (US West)`)
   - **Branch**: `main`
   - **Root Directory**: `hz-solucoes/apps/server`
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: **Free** ✅
5. Clique em "Create Web Service"
6. Aguarde o deploy (pode levar 5-10 minutos na primeira vez)
7. Anote a URL: `https://seu-app.onrender.com`

**⚠️ Nota**: No plano gratuito, o serviço "dorme" após 15 minutos de inatividade. O primeiro request após dormir pode levar 30-60 segundos para acordar.

### Frontend no Vercel (Gratuito)

1. Acesse [Vercel](https://vercel.com) e faça login com GitHub
2. Clique em "Add New Project"
3. Importe o repositório `hzbkps-spec/hzsolucoes`
4. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `hz-solucoes/apps/web`
   - **Build Command**: `npm run build` (já configurado)
   - **Output Directory**: `dist` (já configurado)
5. Adicione variável de ambiente:
   - **Name**: `VITE_TRPC_URL`
   - **Value**: `https://seu-app.onrender.com/trpc` (URL do Render)
6. Clique em "Deploy"

---

## 🚀 Opção 2: Render.com (Backend + Frontend)

Se preferir tudo em um lugar:

### Backend no Render.com
Siga os passos acima da Opção 1.

### Frontend no Render.com

1. No Render.com, clique em "New +" → "Static Site"
2. Conecte o repositório `hzbkps-spec/hzsolucoes`
3. Configure:
   - **Name**: `hz-solucoes-frontend`
   - **Branch**: `main`
   - **Root Directory**: `hz-solucoes/apps/web`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
   - **Plan**: **Free** ✅
4. Adicione variável de ambiente:
   - **Key**: `VITE_TRPC_URL`
   - **Value**: `https://seu-backend.onrender.com/trpc`
5. Clique em "Create Static Site"

---

## 🚀 Opção 3: Fly.io (Backend) + Vercel (Frontend)

### Backend no Fly.io

1. Instale o Fly CLI:
   ```bash
   # Windows (PowerShell)
   iwr https://fly.io/install.ps1 -useb | iex
   ```

2. Faça login:
   ```bash
   fly auth login
   ```

3. No diretório do backend, crie o app:
   ```bash
   cd hz-solucoes/apps/server
   fly launch
   ```
   - Escolha um nome para o app
   - Escolha região próxima
   - Não crie banco de dados agora
   - Não copie configurações

4. O Fly.io criará um `fly.toml`. Edite e adicione:
   ```toml
   [build]
     builder = "paketobuildpacks/builder:base"
   
   [http_service]
     internal_port = 3000
     force_https = true
   ```

5. Faça deploy:
   ```bash
   fly deploy
   ```

6. Anote a URL: `https://seu-app.fly.dev`

### Frontend no Vercel
Siga os passos da Opção 1.

---

## 🚀 Opção 4: Netlify (Frontend) + Render.com (Backend)

### Frontend no Netlify

1. Acesse [Netlify](https://netlify.com) e faça login com GitHub
2. Clique em "Add new site" → "Import an existing project"
3. Conecte o repositório `hzbkps-spec/hzsolucoes`
4. Configure:
   - **Base directory**: `hz-solucoes/apps/web`
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
5. Adicione variável de ambiente:
   - **Key**: `VITE_TRPC_URL`
   - **Value**: `https://seu-backend.onrender.com/trpc`
6. Clique em "Deploy site"

### Backend no Render.com
Siga os passos da Opção 1.

---

## ⚙️ Variáveis de Ambiente

### Backend (Render.com/Fly.io)
- `PORT`: Definido automaticamente (não precisa configurar)
- `CORS_ORIGIN`: URL do frontend (opcional, padrão permite todas)

### Frontend (Vercel/Netlify/Render)
- `VITE_TRPC_URL`: **OBRIGATÓRIO** - URL do backend + `/trpc`
  - Exemplo Render: `https://seu-app.onrender.com/trpc`
  - Exemplo Fly.io: `https://seu-app.fly.dev/trpc`

---

## ✅ Checklist de Deploy Gratuito

- [ ] Backend deployado (Render.com ou Fly.io)
- [ ] URL do backend anotada
- [ ] Frontend deployado (Vercel, Netlify ou Render.com)
- [ ] Variável `VITE_TRPC_URL` configurada no frontend
- [ ] Testar conexão entre frontend e backend
- [ ] Verificar se CORS está funcionando

---

## 🔧 Troubleshooting

### Backend "dormindo" no Render.com (plano gratuito)

**Problema**: Primeiro request após inatividade demora 30-60 segundos.

**Soluções**:
1. Use um serviço de "ping" gratuito para manter acordado:
   - [UptimeRobot](https://uptimerobot.com) - 50 monitors gratuitos
   - [Cron-job.org](https://cron-job.org) - Cron jobs gratuitos
   - Configure para fazer request a cada 10-14 minutos

2. Ou aceite o delay (usuários entenderão)

### Erro de CORS

1. Verifique se `VITE_TRPC_URL` está correto no frontend
2. No backend, configure `CORS_ORIGIN` com a URL exata do frontend
3. Verifique se a URL termina com `/trpc`

### Build falha

1. Verifique se o Root Directory está correto
2. Verifique se todas as dependências estão no `package.json`
3. Veja os logs de build na plataforma

---

## 💡 Dicas para Economizar Recursos

1. **Use Vercel para frontend**: Plano gratuito é muito generoso
2. **Render.com para backend**: Melhor opção gratuita com sleep
3. **Configure UptimeRobot**: Mantém backend acordado (gratuito)
4. **Monitore uso**: Todas as plataformas mostram uso no dashboard

---

## 🎉 Pronto!

Seu projeto está rodando 100% gratuito! 🚀

