# 🚀 Deploy SUPER SIMPLES - TUDO em 1 Lugar Só!

**Render.com = Backend + Frontend = 1 lugar só = GRATUITO = Resolvido! ✅**

Não precisa de 2 lugares diferentes. Tudo no Render.com! 🎯

## ✅ O que você vai fazer:

1. Criar conta no Render.com (gratuito, sem cartão)
2. Deploy do backend (1 clique)
3. Deploy do frontend (1 clique)
4. Pronto! 🎉

---

## 📝 Passo a Passo Completo

### 1️⃣ Criar Conta no Render.com

1. Acesse: https://render.com
2. Clique em **"Get Started for Free"**
3. Faça login com sua conta **GitHub** (mesma do seu projeto)
4. **NÃO precisa de cartão de crédito!** ✅

---

### 2️⃣ Deploy do Backend (2 minutos)

1. No dashboard do Render, clique no botão **"New +"** (canto superior direito)
2. Escolha **"Web Service"**
3. Conecte seu repositório:
   - Se não aparecer, clique em **"Connect account"** e autorize o GitHub
   - Selecione: `hzbkps-spec/hzsolucoes`
4. Configure (copie e cole exatamente):
   - **Name**: `hz-backend` (ou qualquer nome)
   - **Region**: `Oregon (US West)` (ou mais próximo de você)
   - **Branch**: `main`
   - **Root Directory**: `hz-solucoes/apps/server` ⚠️ **IMPORTANTE!**
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: Selecione **"Free"** ✅
5. Clique em **"Create Web Service"**
6. Aguarde 5-10 minutos (primeira vez demora mais)
7. **ANOTE A URL** que aparece (ex: `https://hz-backend.onrender.com`) 📝

---

### 3️⃣ Deploy do Frontend (2 minutos)

1. Ainda no Render, clique em **"New +"** novamente
2. Escolha **"Static Site"**
3. Selecione o mesmo repositório: `hzbkps-spec/hzsolucoes`
4. Configure:
   - **Name**: `hz-frontend` (ou qualquer nome)
   - **Branch**: `main`
   - **Root Directory**: `hz-solucoes/apps/web` ⚠️ **IMPORTANTE!**
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
   - **Plan**: Selecione **"Free"** ✅
5. **ANTES de clicar em "Create"**, role para baixo e adicione variável de ambiente:
   - Clique em **"Add Environment Variable"**
   - **Key**: `VITE_TRPC_URL`
   - **Value**: Cole a URL do backend que você anotou + `/trpc`
     - Exemplo: `https://hz-backend.onrender.com/trpc`
6. Clique em **"Create Static Site"**
7. Aguarde 3-5 minutos
8. **PRONTO!** 🎉 Anote a URL do frontend

---

## 🎯 Resultado Final

Você terá:
- ✅ Backend rodando: `https://hz-backend.onrender.com`
- ✅ Frontend rodando: `https://hz-frontend.onrender.com`
- ✅ Tudo funcionando e conectado!
- ✅ **100% GRATUITO!**

---

## ⚠️ Importante: Backend pode "dormir"

No plano gratuito, o backend "dorme" após 15 minutos sem uso. Quando alguém acessar, ele "acorda" em 30-60 segundos.

**Solução (opcional)**: Use UptimeRobot (gratuito) para manter acordado:
1. Acesse: https://uptimerobot.com
2. Crie conta gratuita
3. Adicione monitor para sua URL do backend
4. Configure para verificar a cada 10 minutos
5. Pronto! Backend sempre acordado! 😊

---

## 🔧 Se algo der errado

### Backend não inicia
- Verifique se o **Root Directory** está correto: `hz-solucoes/apps/server`
- Veja os logs clicando em "Logs" no Render

### Frontend não conecta ao backend
- Verifique se a variável `VITE_TRPC_URL` está correta
- Deve terminar com `/trpc`
- Exemplo correto: `https://hz-backend.onrender.com/trpc`

### Build falha
- Verifique os logs no Render
- Certifique-se que o Root Directory está correto

---

## 💡 Dica Pro

Depois do primeiro deploy, qualquer push no GitHub atualiza automaticamente! 🚀

---

## ✅ Checklist Rápido

- [ ] Conta criada no Render.com
- [ ] Backend deployado e URL anotada
- [ ] Frontend deployado com variável `VITE_TRPC_URL` configurada
- [ ] Testado no navegador
- [ ] (Opcional) UptimeRobot configurado

---

**Pronto! Agora é só seguir os passos acima. É mais fácil do que parece! 😊**

