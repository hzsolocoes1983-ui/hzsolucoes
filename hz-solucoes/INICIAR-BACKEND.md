# 🚀 Como Iniciar o Backend para Testes

## ⚠️ IMPORTANTE

O backend **DEVE estar rodando** antes de executar os testes do TestSprite!

## 📋 Passo a Passo

### 1. Abra um Terminal

Abra um terminal PowerShell ou CMD na raiz do projeto.

### 2. Navegue até a pasta do servidor

```powershell
cd hz-solucoes/apps/server
```

### 3. Instale as dependências (se necessário)

```powershell
npm install
```

### 4. Inicie o servidor

```powershell
npm run dev
```

### 5. Verifique se está rodando

Você deve ver estas mensagens:

```
Database initialized
Server listening on http://localhost:3000
WhatsApp webhook: http://localhost:3000/whatsapp/webhook
```

## ✅ Verificação

### Teste Manual do Endpoint

Abra outro terminal e teste:

```powershell
# Teste o endpoint de login guest
curl http://localhost:3000/trpc/loginGuest -Method POST -ContentType "application/json" -Body '[{"id":1,"json":{}}]'
```

Ou abra no navegador:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000

## 🔧 Problemas Comuns

### Erro: "Port 3000 already in use"

**Solução:** Pare o processo que está usando a porta 3000:

```powershell
# Encontre o processo
netstat -ano | findstr :3000

# Mate o processo (substitua PID pelo número encontrado)
taskkill /PID <PID> /F
```

### Erro: "Failed to initialize database"

**Solução:** 
1. Verifique se tem permissão para criar arquivos na pasta `apps/server`
2. O arquivo `local.db` será criado automaticamente

### Erro: "Cannot find module"

**Solução:**
```powershell
cd apps/server
npm install
```

## 📝 Notas

- O servidor roda em modo desenvolvimento (hot reload)
- O banco de dados SQLite será criado automaticamente em `apps/server/local.db`
- Para parar o servidor, pressione `Ctrl+C` no terminal

## 🎯 Próximo Passo

Após iniciar o backend, você pode:
1. Reexecutar os testes do TestSprite
2. Testar manualmente no navegador
3. Verificar os logs do servidor

