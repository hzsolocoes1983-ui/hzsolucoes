# 🐛 Bugs Identificados - HZ Soluções

## Data da Análise: 18/11/2025

---

## ✅ O que está FUNCIONANDO

### Backend
- ✅ Servidor rodando em: `https://hzsolucoes.onrender.com`
- ✅ Endpoint `/health` respondendo corretamente
- ✅ Banco de dados configurado e funcional
- ✅ Todas as rotas tRPC implementadas
- ✅ Login guest (`loginGuest`) funcionando
- ✅ Retorna `userId` corretamente no login

### Frontend
- ✅ Interface carrega corretamente
- ✅ Navegação entre páginas funciona
- ✅ Variável `VITE_TRPC_URL` configurada corretamente
- ✅ Conecta ao backend (quando backend está acordado)
- ✅ Função `getAuthenticatedUser()` implementada corretamente
- ✅ Salva user no localStorage após login

---

## 🐛 BUGS CRÍTICOS Identificados

### Bug #1: userId undefined nas requisições ❌

**Sintoma:**
```
HTTP 400: {"error":{"message":"invalid_type", "expected":"number", "received":"undefined", "path":["userId"]}}
```

**Causa Raiz:**
O problema NÃO é no login! O login salva o user corretamente no localStorage.

O problema está nas **MUTATIONS** (addTransaction, addItem, etc.) que não estão pegando o userId do contexto corretamente.

**Localização do Bug:**
Arquivo: `/hz-solucoes/apps/web/src/pages/Dashboard.tsx` (e outras páginas)

**Exemplo do código problemático:**
```typescript
// Linha ~200-250 do Dashboard.tsx
const addExpenseMutation = useMutation({
  mutationFn: async () => {
    const amount = parseBrazilianNumber(expenseAmount);
    if (amount <= 0) throw new Error('Valor inválido');
    
    // BUG: user pode estar null ou undefined aqui!
    await trpcFetch('addTransaction', {
      userId: user.id,  // ❌ Se user for null, user.id é undefined!
      type: 'expense',
      amount,
      description: expenseDesc,
    });
  },
  // ...
});
```

**Por que acontece:**
1. User é obtido no início do componente: `const user = getAuthenticatedUser();`
2. Mas pode haver um timing issue ou o localStorage pode estar vazio
3. Quando a mutation é chamada, `user` pode ser null
4. Resultado: `user.id` = undefined → erro 400

**Solução:**
```typescript
// ANTES (bugado):
const user = getAuthenticatedUser();

// DEPOIS (corrigido):
const addExpenseMutation = useMutation({
  mutationFn: async () => {
    // Pega user dentro da mutation para garantir que está atualizado
    const currentUser = getAuthenticatedUser();
    if (!currentUser) {
      throw new Error('Usuário não autenticado');
    }
    
    const amount = parseBrazilianNumber(expenseAmount);
    if (amount <= 0) throw new Error('Valor inválido');
    
    await trpcFetch('addTransaction', {
      userId: currentUser.id,  // ✅ Garantido que não é undefined
      type: 'expense',
      amount,
      description: expenseDesc,
    });
  },
});
```

---

### Bug #2: Backend hiberna (Render Free Tier) ⚠️

**Sintoma:**
- Primeira requisição demora 30-60 segundos
- Backend "acorda" e depois funciona
- Após 15 minutos de inatividade, volta a hibernar

**Causa:**
Limitação do plano gratuito do Render.

**Solução:**
1. **Curto prazo:** Aceitar a limitação (primeira requisição demora)
2. **Médio prazo:** Usar serviço de "ping" para manter ativo
3. **Longo prazo:** Migrar para Railway, Fly.io ou plano pago do Render

---

### Bug #3: Falta tratamento de erro nas mutations ⚠️

**Sintoma:**
Quando há erro, mostra mensagem técnica confusa para o usuário.

**Exemplo:**
```
Erro: HTTP 400: {"error":{"message":"[\n {\n \"code\": \"invalid_type\"...
```

**Solução:**
Adicionar tratamento de erro amigável:

```typescript
onError: (error: any) => {
  console.error('Erro ao adicionar despesa:', error);
  
  // Mensagem amigável baseada no erro
  let message = 'Erro ao adicionar despesa';
  
  if (error.message?.includes('invalid_type')) {
    message = 'Dados inválidos. Verifique os campos e tente novamente.';
  } else if (error.message?.includes('Usuário não autenticado')) {
    message = 'Sessão expirada. Faça login novamente.';
    navigate('/');
  }
  
  alert(message);
}
```

---

### Bug #4: Falta validação de campos antes de enviar ⚠️

**Sintoma:**
Usuário pode tentar salvar com campos vazios ou inválidos.

**Solução:**
Adicionar validação antes da mutation:

```typescript
const handleAddExpense = () => {
  const amount = parseBrazilianNumber(expenseAmount);
  
  // Validações
  if (!expenseAmount || amount <= 0) {
    alert('Por favor, insira um valor válido');
    return;
  }
  
  if (!expenseDesc?.trim()) {
    alert('Por favor, insira uma descrição');
    return;
  }
  
  // Se passou nas validações, chama a mutation
  addExpenseMutation.mutate();
};
```

---

### Bug #5: Página Transactions não carrega dados ⚠️

**Localização:** `/hz-solucoes/apps/web/src/pages/Transactions.tsx`

**Problema:**
Mesma issue do userId - precisa garantir que user está definido antes de fazer queries.

---

### Bug #6: Falta loading state visual ⚠️

**Sintoma:**
Quando usuário clica em "Salvar", não há feedback visual de que está processando.

**Solução:**
Usar o estado `isPending` da mutation:

```typescript
<Button 
  onClick={handleAddExpense}
  disabled={addExpenseMutation.isPending}
>
  {addExpenseMutation.isPending ? 'Salvando...' : 'Salvar'}
</Button>
```

---

## 📊 Resumo dos Bugs

| Bug | Severidade | Impacto | Tempo para Corrigir |
|-----|-----------|---------|---------------------|
| #1: userId undefined | 🔴 Crítico | Impede uso do sistema | 15 min |
| #2: Backend hiberna | 🟡 Médio | Primeira requisição lenta | Limitação da plataforma |
| #3: Erros confusos | 🟡 Médio | UX ruim | 10 min |
| #4: Falta validação | 🟡 Médio | Erros evitáveis | 10 min |
| #5: Transactions bugada | 🟡 Médio | Página não funciona | 15 min |
| #6: Falta loading | 🟢 Baixo | UX ruim | 5 min |

**Tempo total estimado para correções:** ~1 hora

---

## 🎯 Prioridade de Correção

### Fase 1: Bugs Críticos (30 min)
1. ✅ Corrigir userId undefined em todas as mutations
2. ✅ Adicionar validações de campos
3. ✅ Melhorar tratamento de erros

### Fase 2: Melhorias UX (20 min)
4. ✅ Adicionar loading states
5. ✅ Corrigir página Transactions
6. ✅ Mensagens de erro amigáveis

### Fase 3: Otimizações (10 min)
7. ✅ Adicionar retry automático em caso de erro
8. ✅ Melhorar feedback visual
9. ✅ Adicionar confirmações para ações importantes

---

## 📝 Arquivos que Precisam ser Corrigidos

1. `/hz-solucoes/apps/web/src/pages/Dashboard.tsx` - Corrigir mutations
2. `/hz-solucoes/apps/web/src/pages/Transactions.tsx` - Corrigir queries
3. `/hz-solucoes/apps/web/src/pages/Items.tsx` - Corrigir mutations
4. `/hz-solucoes/apps/web/src/pages/Goals.tsx` - Corrigir mutations
5. `/hz-solucoes/apps/web/src/pages/Reports.tsx` - Corrigir queries

---

**Conclusão:** Os bugs são todos corrigíveis e não são problemas de arquitetura. O sistema está bem estruturado, só precisa de ajustes finos nas validações e tratamento de erros.
