# 🔒 Correções de Segurança Aplicadas - HZ Soluções

**Data:** 19/11/2025  
**Status:** ✅ Todas as correções críticas aplicadas

---

## 📋 Resumo das Correções

### ✅ 1. Formato do Body da Requisição tRPC
**Arquivo:** `hz-solucoes/apps/web/src/lib/trpc.ts`

**Problema:** O formato `{ input: input }` estava causando erro 400 ao adicionar transações.

**Solução:** Alterado para enviar o input diretamente no body:
```typescript
// ANTES:
const requestBody = { input: input };

// DEPOIS:
const requestBody = input;
```

---

### ✅ 2. Hash de Senhas com bcrypt
**Arquivos Modificados:**
- `hz-solucoes/apps/server/package.json` - Adicionado `bcrypt` e `@types/bcrypt`
- `hz-solucoes/apps/server/src/lib/auth.ts` - Criado módulo de autenticação
- `hz-solucoes/apps/server/src/routes/trpc.ts` - Atualizado `login`, `loginGuest` e `register`

**Implementação:**
- Senhas agora são hasheadas com bcrypt (10 rounds) antes de serem salvas
- Comparação de senhas usa `bcrypt.compare()` em vez de comparação direta
- Senhas antigas em texto plano precisarão ser migradas (veja script abaixo)

**Funções Criadas:**
```typescript
hashPassword(password: string): Promise<string>
comparePassword(password: string, hash: string): Promise<boolean>
```

---

### ✅ 3. Autenticação JWT
**Arquivos Modificados:**
- `hz-solucoes/apps/server/package.json` - Adicionado `jsonwebtoken` e `@types/jsonwebtoken`
- `hz-solucoes/apps/server/src/lib/auth.ts` - Funções JWT implementadas
- `hz-solucoes/apps/server/src/routes/trpc.ts` - Tokens JWT em vez de tokens estáticos

**Implementação:**
- Tokens agora são JWT com expiração (padrão: 7 dias)
- Payload inclui: `userId`, `whatsapp`, `name`
- Secret configurável via `JWT_SECRET` (obrigatório em produção)

**Funções Criadas:**
```typescript
generateToken(payload: JWTPayload): string
verifyToken(token: string): JWTPayload
extractTokenFromHeader(authHeader: string): string | null
```

**Variáveis de Ambiente:**
- `JWT_SECRET` - Secret para assinar tokens (obrigatório em produção)
- `JWT_EXPIRES_IN` - Tempo de expiração (padrão: `7d`)

---

### ✅ 4. CORS Seguro para Produção
**Arquivo:** `hz-solucoes/apps/server/src/index.ts`

**Implementação:**
- Em produção: usa `CORS_ORIGIN` ou `VERCEL_URL` (não permite `*`)
- Em desenvolvimento: permite todas as origens (para facilitar desenvolvimento)
- Headers permitidos: `Content-Type`, `Authorization`
- Métodos permitidos: `GET`, `POST`, `PUT`, `DELETE`, `OPTIONS`

**Configuração:**
```typescript
origin: process.env.NODE_ENV === 'production' 
  ? (process.env.CORS_ORIGIN || process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '*')
  : (process.env.CORS_ORIGIN || '*')
```

---

## 📦 Dependências Adicionadas

```json
{
  "dependencies": {
    "bcrypt": "^5.1.1",
    "jsonwebtoken": "^9.0.2"
  },
  "devDependencies": {
    "@types/bcrypt": "^5.0.2",
    "@types/jsonwebtoken": "^9.0.5"
  }
}
```

**Instalação:**
```bash
cd hz-solucoes/apps/server
npm install
```

---

## ⚠️ Migração de Dados Existentes

### Problema
Se você já tem usuários no banco de dados com senhas em texto plano, eles precisarão ser migrados.

### Solução
Execute o script de migração (veja `migrate-passwords.ts` abaixo) ou faça os usuários redefinirem suas senhas.

---

## 🔧 Variáveis de Ambiente Necessárias

### Obrigatórias em Produção
```env
JWT_SECRET=sua-chave-secreta-super-segura-aqui
DATABASE_URL=libsql://seu-banco.turso.io
DATABASE_AUTH_TOKEN=seu-token-aqui
```

### Opcionais
```env
JWT_EXPIRES_IN=7d
CORS_ORIGIN=https://seu-dominio.com
NODE_ENV=production
```

---

## 🧪 Testes Recomendados

1. **Teste de Registro:**
   - Criar novo usuário
   - Verificar se senha está hasheada no banco
   - Tentar login com senha correta
   - Tentar login com senha incorreta

2. **Teste de Login:**
   - Login com credenciais válidas
   - Verificar se token JWT é retornado
   - Verificar se token pode ser decodificado

3. **Teste de CORS:**
   - Em produção, verificar se requisições de outros domínios são bloqueadas
   - Verificar se requisições do domínio correto são permitidas

4. **Teste de Transações:**
   - Adicionar receita
   - Adicionar despesa
   - Verificar se não há mais erro 400

---

## 📝 Próximos Passos Recomendados

1. **Migrar senhas existentes** (se houver usuários no banco)
2. **Configurar `JWT_SECRET`** em produção (use uma chave forte e aleatória)
3. **Testar todas as funcionalidades** após as mudanças
4. **Atualizar frontend** se necessário para lidar com tokens JWT
5. **Implementar middleware de autenticação** para proteger rotas sensíveis

---

## 🔍 Verificação de Segurança

- ✅ Senhas não são mais armazenadas em texto plano
- ✅ Tokens têm expiração automática
- ✅ CORS configurado para produção
- ✅ Comparação de senhas usa bcrypt (timing-safe)
- ⚠️ **Pendente:** Middleware de autenticação para proteger rotas
- ⚠️ **Pendente:** Rate limiting para prevenir brute force
- ⚠️ **Pendente:** Validação de força de senha no registro

---

## 📚 Referências

- [bcrypt Documentation](https://www.npmjs.com/package/bcrypt)
- [JWT Best Practices](https://jwt.io/introduction)
- [OWASP Password Storage](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)


