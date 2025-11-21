# 🔐 Guia de Implementação de Segurança - HZ Soluções

**Data:** 20 de Novembro de 2025

Este documento descreve como aplicar as melhorias de segurança essenciais no seu projeto, incluindo **hash de senhas (bcrypt)**, **autenticação com JWT** e **configurações de servidor (CORS e Rate Limiting)**.

---

## ✨ O Que Foi Implementado

### 1. Hash de Senhas com `bcrypt`
- **O quê:** As senhas não são mais salvas em texto plano. Elas são convertidas em um "hash" criptográfico antes de serem salvas no banco de dados.
- **Por quê:** Se alguém conseguir acesso ao seu banco de dados, não conseguirá ver as senhas dos usuários. Isso protege suas credenciais mesmo em caso de vazamento de dados.

### 2. Autenticação com `JWT` (JSON Web Token)
- **O quê:** O sistema agora gera um token de autenticação seguro (JWT) no login, que é usado para validar todas as requisições subsequentes.
- **Por quê:** Tokens JWT são um padrão da indústria, mais seguros que o token anterior (`token-` + ID). Eles podem expirar automaticamente e são à prova de violação.

### 3. Configuração Segura de `CORS`
- **O quê:** O servidor agora só aceita requisições do seu próprio frontend (`http://localhost:5173` em desenvolvimento) e não de qualquer site.
- **Por quê:** Impede que sites maliciosos façam requisições para sua API em nome do usuário, protegendo contra ataques de Cross-Site Request Forgery (CSRF).

### 4. `Rate Limiting` (Limitador de Requisições)
- **O quê:** Limita o número de requisições que um mesmo IP pode fazer em um determinado período (100 requisições a cada 15 minutos em produção).
- **Por quê:** Protege sua API contra ataques de força bruta (tentativas repetidas de login) e ataques de negação de serviço (DDoS).

---

## 📋 Passo a Passo Para Aplicar as Melhorias

**IMPORTANTE:** Faça um backup do seu projeto antes de começar!

### 1. Instalar Novas Dependências

Abra o terminal na pasta `apps/server` e instale os novos pacotes:

```bash
cd apps/server
npm install bcrypt jsonwebtoken express-rate-limit
npm install @types/bcrypt @types/jsonwebtoken --save-dev
```

(Os `package.json` que vou te enviar já terão isso, então um `npm install` será suficiente).

### 2. Atualizar Arquivos do Servidor

Eu vou te enviar um ZIP com os seguintes arquivos. Você deve **substituir** os existentes ou **adicionar** os novos:

- **Substituir:**
  - `apps/server/package.json`
  - `apps/server/.env.example`
- **Renomear:**
  - Renomeie `apps/server/src/index.ts` para `index-old.ts`
  - Renomeie `apps/server/src/routes/trpc.ts` para `trpc-old.ts`
- **Adicionar (Novos):**
  - `apps/server/src/index-secure.ts` (renomear para `index.ts`)
  - `apps/server/src/routes/trpc-secure.ts` (renomear para `trpc.ts`)
  - `apps/server/src/utils/auth.ts`
  - `apps/server/src/scripts/migrate-passwords.ts`
  - `apps/server/drizzle/migrations/002_rename_password_to_hash.sql`

### 3. Configurar a Chave Secreta do JWT

Abra o arquivo `apps/server/.env` e adicione a seguinte linha:

```env
# Gere uma chave única para produção!
JWT_SECRET=sua_chave_secreta_muito_segura_aqui_mude_em_producao
```

**Para gerar uma chave segura, execute no terminal:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
Copie o resultado e cole no lugar de `sua_chave_secreta...`.

### 4. Aplicar a Migration do Banco de Dados

Esta migration adiciona a nova coluna `password_hash`.

```bash
cd apps/server

# Execute o script de migração SQL manualmente
# (O Drizzle Kit pode não pegar a mudança de nome de coluna corretamente)
sqlite3 local.db < drizzle/migrations/002_rename_password_to_hash.sql
```

### 5. Migrar Senhas Existentes para Hash

Agora, vamos converter as senhas que já existem no banco para o novo formato seguro. **Execute este script APENAS UMA VEZ!**

```bash
cd apps/server
tsx src/scripts/migrate-passwords.ts
```

O script irá ler as senhas antigas, criar o hash e salvar na nova coluna `password_hash`.

### 6. Testar o Sistema

Inicie os servidores como de costume:

**Backend (Terminal 1):**
```bash
cd apps/server
npm run dev
```

**Frontend (Terminal 2):**
```bash
cd apps/web
npm run dev
```

**O que testar:**
1.  **Login:** Tente fazer login com seu usuário e senha normais. Deve funcionar.
2.  **Registro:** Crie um novo usuário para garantir que a senha está sendo salva com hash.
3.  **Acesso:** Navegue pelas páginas. O token JWT deve manter você logado.

---

## 📊 Resumo das Mudanças

| Categoria | Melhoria | Status |
|---|---|---|
| **Senhas** | Hash com `bcrypt` | ✅ Implementado |
| **Autenticação** | Tokens `JWT` | ✅ Implementado |
| **Acesso API** | `CORS` seguro | ✅ Implementado |
| **Proteção API** | `Rate Limiting` | ✅ Implementado |
| **Banco de Dados** | Schema atualizado | ✅ Implementado |
| **Migração** | Script para senhas | ✅ Criado |

---

## ⚠️ Pontos de Atenção

- **Backup:** Sempre faça backup antes de aplicar mudanças no banco de dados.
- **`JWT_SECRET`:** NUNCA compartilhe sua chave secreta. Mantenha-a segura no arquivo `.env`.
- **Migração de Senhas:** O script de migração foi feito para ser executado apenas uma vez. Executá-lo novamente não causará problemas, pois ele pula usuários já migrados, mas não é necessário.

Com essas mudanças, seu projeto estará significativamente mais seguro e alinhado com as melhores práticas de desenvolvimento web.

**Desenvolvido por:** Manus AI
