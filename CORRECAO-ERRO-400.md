# 🔧 Correção: Erro HTTP 400 ao Salvar Transações

## ❌ Problema

Ao tentar salvar uma despesa ou receita, o sistema retornava erro HTTP 400 com a mensagem:
```
userId: Expected "number", received "undefined" - Required
type: Expected "'income' | 'expense'", received "undefined" - Required  
amount: Expected "number", received "undefined" - Required
```

## ✅ Correções Aplicadas

### 1. **Validações Robustas no Frontend** (`hz-solucoes/apps/web/src/pages/Dashboard.tsx`)

**Problema:**
- Dados não eram validados antes de enviar
- `userId`, `amount` ou `type` poderiam estar undefined
- Falta de validação de tipos

**Solução:**
- ✅ Validação de `expenseAmount`/`incomeAmount` antes de processar
- ✅ Validação de `user.id` antes de usar
- ✅ Conversão explícita para `Number()` em `userId` e `amount`
- ✅ Validação final antes de enviar para garantir que todos os campos estão presentes
- ✅ Mensagens de erro mais claras para o usuário

```typescript
// Exemplo das validações adicionadas:
if (!expenseAmount || expenseAmount.trim() === '') {
  throw new Error('Por favor, informe um valor');
}

const amount = parseBrazilianNumber(expenseAmount);
if (!amount || amount <= 0 || isNaN(amount)) {
  throw new Error('Valor inválido. Use o formato: 1.000,00');
}

const userId = typeof user.id === 'string' ? parseInt(user.id, 10) : user.id;
if (!userId || isNaN(userId)) {
  throw new Error('ID do usuário inválido. Faça login novamente.');
}

const input = {
  userId: Number(userId),  // Conversão explícita
  type: 'expense' as const,
  amount: Number(amount),  // Conversão explícita
  description: expenseDesc?.trim() || undefined,
};

// Validação final
if (!input.userId || !input.type || !input.amount) {
  throw new Error('Dados inválidos. Verifique os campos preenchidos.');
}
```

### 2. **Validações no trpcFetch** (`hz-solucoes/apps/web/src/lib/trpc.ts`)

**Problema:**
- `input` poderia ser `undefined` ou `null`
- Falta de validação antes de serializar

**Solução:**
- ✅ Validação de `input` antes de processar
- ✅ Verificação de tipo (deve ser objeto, não array)
- ✅ Erros mais descritivos
- ✅ Logs detalhados para debug

```typescript
if (!input) {
  console.error(`[tRPC] Input é undefined/null para ${procedure}`);
  throw new Error(`Input inválido para ${procedure}: input não pode ser undefined ou null`);
}

if (typeof input !== 'object' || Array.isArray(input)) {
  console.error(`[tRPC] Input deve ser um objeto para ${procedure}`);
  throw new Error(`Input inválido para ${procedure}: deve ser um objeto`);
}
```

## 🔍 Como Testar

1. **Abra o console do navegador** (F12)
2. **Tente adicionar uma despesa:**
   - Preencha o valor (ex: `1.000,00`)
   - Preencha a descrição (ex: `salão`)
   - Clique em "Salvar"
3. **Verifique os logs no console:**
   - Deve aparecer `[Dashboard] Enviando addTransaction:` com os dados
   - Deve aparecer `[tRPC] addTransaction - Request body:` com o JSON
4. **Se ainda houver erro:**
   - Verifique se o `user.id` está presente no localStorage
   - Verifique se o valor está no formato correto (1.000,00)
   - Veja os logs detalhados no console

## 📋 Checklist de Verificação

- [ ] Usuário está logado (verificar localStorage)
- [ ] Valor está no formato brasileiro (1.000,00)
- [ ] Descrição está preenchida (opcional, mas recomendado)
- [ ] Console não mostra erros antes de enviar
- [ ] Todos os campos (`userId`, `type`, `amount`) estão presentes nos logs

## 🚀 Próximos Passos

1. **Fazer commit das alterações:**
   ```bash
   git add .
   git commit -m "fix: corrige erro HTTP 400 ao salvar transações com validações robustas"
   git push origin main
   ```

2. **Testar em produção após deploy**

3. **Se o problema persistir:**
   - Verificar se o backend está recebendo os dados corretamente
   - Verificar logs do backend no Render
   - Verificar se há problemas de CORS

## 📝 Arquivos Modificados

1. `hz-solucoes/apps/web/src/pages/Dashboard.tsx` - Validações nas mutations `addExpense` e `addIncome`
2. `hz-solucoes/apps/web/src/lib/trpc.ts` - Validações no `trpcFetch`

