# 🚀 Como Iniciar o Projeto

## 📍 URLs do Projeto

### Desenvolvimento Local:
- **Frontend (Web)**: http://localhost:5173
- **Backend (API)**: http://localhost:3000
- **tRPC Endpoint**: http://localhost:3000/trpc

### Se estiver em produção:
- Verifique as variáveis de ambiente `VITE_TRPC_URL` no frontend

---

## 🛠️ Como Iniciar

### 1️⃣ Iniciar o Backend (Terminal 1)

```bash
cd hz-solucoes/apps/server
npm install  # Se ainda não instalou as dependências
npm run dev
```

O backend estará rodando em: **http://localhost:3000**

### 2️⃣ Iniciar o Frontend (Terminal 2)

```bash
cd hz-solucoes/apps/web
npm install  # Se ainda não instalou as dependências
npm run dev
```

O frontend estará rodando em: **http://localhost:5173**

---

## ✅ Verificar se está funcionando

1. Abra o navegador em: **http://localhost:5173**
2. Abra o Console do navegador (F12)
3. Verifique se há erros ou logs `[tRPC]`
4. Faça login (ou use o login mockado)
5. Acesse o Dashboard

---

## 🔍 Debug

### Se o frontend não conectar ao backend:

1. Verifique se o backend está rodando na porta 3000
2. Verifique o console do navegador (F12) para erros
3. Verifique se há mensagens de erro no Dashboard
4. Confirme que a variável `VITE_TRPC_URL` está configurada (ou deixe vazia para usar `/trpc`)

### Logs importantes:

- No console do navegador: logs começando com `[tRPC]`
- No terminal do backend: logs de requisições recebidas

---

## 📝 Notas

- O frontend usa proxy para `/trpc` apontando para `http://localhost:3000`
- Em produção, configure `VITE_TRPC_URL` com a URL completa do backend
- O backend aceita CORS de qualquer origem em desenvolvimento



