# 🔄 COMO REINICIAR O SERVIDOR - Passo a Passo

## 📋 Método 1: Usando o Terminal Atual

### Passo 1: Parar o Servidor
1. **Encontre o terminal** onde o servidor está rodando
2. **Pressione:** `Ctrl + C` (isso vai parar o servidor)
3. Você deve ver algo como: `^C` ou o prompt voltar

### Passo 2: Reiniciar o Servidor
1. **No mesmo terminal**, digite:
   ```bash
   npm run dev
   ```
2. **Pressione Enter**
3. Aguarde aparecer:
   ```
   Database initialized
   Server listening on http://localhost:3000
   WhatsApp webhook: http://localhost:3000/whatsapp/webhook
   ```

---

## 📋 Método 2: Usando o Script .bat (Mais Fácil)

### Passo 1: Fechar o Terminal Atual
- Feche o terminal onde o servidor está rodando

### Passo 2: Usar o Script
1. **Navegue até a pasta do projeto** no Windows Explorer:
   ```
   C:\Users\hz\Desktop\hz-solucoes-realtime-whatsapp\hz-solucoes
   ```
2. **Clique duas vezes** no arquivo: `INICIAR-BACKEND.bat`
3. Uma janela do terminal vai abrir e iniciar o servidor automaticamente

---

## 📋 Método 3: Novo Terminal (Se não encontrar o atual)

### Passo 1: Abrir Novo Terminal
1. Pressione `Windows + R`
2. Digite: `powershell` ou `cmd`
3. Pressione Enter

### Passo 2: Navegar até a Pasta
```powershell
cd C:\Users\hz\Desktop\hz-solucoes-realtime-whatsapp\hz-solucoes\apps\server
```

### Passo 3: Iniciar o Servidor
```powershell
npm run dev
```

---

## ✅ Como Saber se Está Funcionando

Você deve ver estas mensagens:
```
Database initialized
Server listening on http://localhost:3000
WhatsApp webhook: http://localhost:3000/whatsapp/webhook
```

**Se aparecer isso, o servidor está rodando! ✅**

---

## 🔍 Verificar se Está Funcionando

Abra outro terminal e teste:
```powershell
curl http://localhost:3000/health
```

Ou abra no navegador:
- http://localhost:3000/health

Deve retornar: `{"status":"ok","timestamp":"..."}`

---

## ⚠️ Problemas Comuns

### Erro: "Port 3000 already in use"
**Solução:** Alguém já está usando a porta 3000
1. Feche outros terminais que possam estar rodando o servidor
2. Ou mate o processo:
   ```powershell
   netstat -ano | findstr :3000
   taskkill /PID <número_do_PID> /F
   ```

### Erro: "Cannot find module"
**Solução:** Instale as dependências:
```powershell
cd apps\server
npm install
npm run dev
```

### Servidor não inicia
**Solução:** Verifique se está na pasta correta:
```powershell
cd C:\Users\hz\Desktop\hz-solucoes-realtime-whatsapp\hz-solucoes\apps\server
npm run dev
```

---

## 🎯 Resumo Rápido

**Mais Fácil:**
1. Feche o terminal atual
2. Clique duas vezes em `INICIAR-BACKEND.bat`

**Ou Manualmente:**
1. No terminal: `Ctrl + C` (parar)
2. Digite: `npm run dev` (reiniciar)

---

**Pronto! Agora você sabe como reiniciar o servidor! 🚀**

