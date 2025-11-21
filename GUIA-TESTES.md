# 🧪 Guia de Testes Automatizados

## Visão Geral

O projeto agora possui testes automatizados usando **Vitest**, um framework de testes rápido e moderno para projetos TypeScript/JavaScript.

## 📦 Configuração

### Backend

**Dependências instaladas:**
```json
{
  "vitest": "^4.0.13",
  "@vitest/ui": "^4.0.13"
}
```

**Arquivo de configuração:** `vitest.config.ts`

### Scripts Disponíveis

```bash
# Executar testes em modo watch (reexecuta ao salvar)
npm test

# Executar testes uma vez e sair
npm run test:run

# Executar testes com interface visual
npm run test:ui

# Executar testes com cobertura de código
npm run test:coverage
```

## 📊 Testes Implementados

### 1. Testes de Autenticação (`auth.test.ts`)

**13 testes** cobrindo:

- ✅ Hash de senhas com bcrypt
- ✅ Comparação de senhas
- ✅ Geração de tokens JWT
- ✅ Verificação de tokens
- ✅ Extração de tokens do header
- ✅ Fluxo completo de autenticação

**Exemplo de teste:**

```typescript
it('should hash a password', async () => {
  const password = 'mySecretPassword123';
  const hash = await hashPassword(password);
  
  expect(hash).toBeDefined();
  expect(hash).not.toBe(password);
  expect(hash.length).toBe(60); // bcrypt hash length
});
```

### 2. Testes de Categorização (`categorization.test.ts`)

**22 testes** cobrindo:

- ✅ Categorização de Alimentação
- ✅ Categorização de Transporte
- ✅ Categorização de Saúde
- ✅ Categorização de Contas
- ✅ Categoria padrão (Outros)
- ✅ Case insensitivity
- ✅ Descrições complexas

**Bug encontrado e corrigido:**

O teste descobriu que "farmácia" com acento não estava sendo reconhecida. Foi corrigido adicionando suporte para acentuação.

## 🎯 Como Escrever Testes

### Estrutura Básica

```typescript
import { describe, it, expect } from 'vitest';

describe('Nome do Módulo', () => {
  describe('Nome da Função', () => {
    it('should do something', () => {
      // Arrange (preparar)
      const input = 'test';
      
      // Act (executar)
      const result = myFunction(input);
      
      // Assert (verificar)
      expect(result).toBe('expected');
    });
  });
});
```

### Testes Assíncronos

```typescript
it('should handle async operations', async () => {
  const result = await asyncFunction();
  expect(result).toBeDefined();
});
```

### Testes de Erros

```typescript
it('should throw error for invalid input', () => {
  expect(() => functionThatThrows()).toThrow('Error message');
});
```

### Mocking (Simulação)

```typescript
import { vi } from 'vitest';

it('should call external service', async () => {
  const mockFetch = vi.fn().mockResolvedValue({ data: 'test' });
  global.fetch = mockFetch;
  
  await myFunction();
  
  expect(mockFetch).toHaveBeenCalledTimes(1);
});
```

## 📈 Cobertura de Código

Execute para ver a cobertura:

```bash
npm run test:coverage
```

Isso gera um relatório mostrando quais linhas de código estão cobertas por testes.

**Meta de cobertura recomendada:**
- Funções críticas: 100%
- Código geral: > 80%

## 🚀 Próximos Testes a Implementar

### Backend

1. **Testes de Rotas tRPC**
   - [ ] addTransaction
   - [ ] getMonthlyTotal
   - [ ] addGoal
   - [ ] addItem

2. **Testes de Webhook WhatsApp**
   - [ ] Parser de comandos
   - [ ] Extração de mensagens
   - [ ] Formatação de respostas

3. **Testes de Banco de Dados**
   - [ ] Migrations
   - [ ] Queries complexas
   - [ ] Índices

### Frontend

1. **Testes de Componentes**
   - [ ] ExpenseModal
   - [ ] IncomeModal
   - [ ] ItemModal
   - [ ] Dashboard

2. **Testes de Validação**
   - [ ] Schemas Zod
   - [ ] Formatação de moeda
   - [ ] Parsing de números

3. **Testes de Integração**
   - [ ] Fluxo de login
   - [ ] Adicionar transação
   - [ ] Navegação

## 💡 Boas Práticas

### 1. Teste Comportamento, Não Implementação

```typescript
// ❌ Ruim - testa implementação
it('should call database.insert', () => {
  expect(database.insert).toHaveBeenCalled();
});

// ✅ Bom - testa comportamento
it('should add transaction to database', async () => {
  await addTransaction(data);
  const transactions = await getTransactions();
  expect(transactions).toContainEqual(data);
});
```

### 2. Use Nomes Descritivos

```typescript
// ❌ Ruim
it('test 1', () => { ... });

// ✅ Bom
it('should return error when amount is negative', () => { ... });
```

### 3. Um Assert Por Teste (quando possível)

```typescript
// ❌ Ruim - múltiplos conceitos
it('should work', () => {
  expect(result.name).toBe('John');
  expect(result.age).toBe(30);
  expect(result.email).toBe('john@example.com');
});

// ✅ Bom - conceitos separados
it('should have correct name', () => {
  expect(result.name).toBe('John');
});

it('should have correct age', () => {
  expect(result.age).toBe(30);
});
```

### 4. Teste Casos Extremos

```typescript
describe('parseBrazilianNumber', () => {
  it('should parse normal number', () => {
    expect(parseBrazilianNumber('1.234,56')).toBe(1234.56);
  });
  
  it('should handle empty string', () => {
    expect(parseBrazilianNumber('')).toBe(0);
  });
  
  it('should handle very large numbers', () => {
    expect(parseBrazilianNumber('999.999.999,99')).toBe(999999999.99);
  });
  
  it('should handle numbers without decimals', () => {
    expect(parseBrazilianNumber('1000')).toBe(1000);
  });
});
```

## 🔍 Debugging de Testes

### Ver output detalhado

```bash
npm test -- --reporter=verbose
```

### Executar apenas um teste

```typescript
it.only('should run only this test', () => {
  // ...
});
```

### Pular um teste

```typescript
it.skip('should skip this test', () => {
  // ...
});
```

### Ver logs no console

```typescript
it('should debug', () => {
  console.log('Debug info:', someVariable);
  expect(true).toBe(true);
});
```

## 📚 Recursos

- [Vitest Documentation](https://vitest.dev/)
- [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)
- [Test-Driven Development (TDD)](https://martinfowler.com/bliki/TestDrivenDevelopment.html)

## 🎓 TDD (Test-Driven Development)

### Ciclo Red-Green-Refactor

1. **Red** - Escreva um teste que falha
2. **Green** - Escreva o código mínimo para passar
3. **Refactor** - Melhore o código mantendo os testes verdes

**Exemplo:**

```typescript
// 1. Red - Teste que falha
it('should format currency', () => {
  expect(formatCurrency(1234.56)).toBe('R$ 1.234,56');
});

// 2. Green - Implementação mínima
function formatCurrency(value: number): string {
  return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
}

// 3. Refactor - Melhorar sem quebrar
function formatCurrency(value: number, currency = 'BRL'): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency,
  }).format(value);
}
```

## ✅ Checklist de Testes

Antes de fazer commit:

- [ ] Todos os testes passam (`npm run test:run`)
- [ ] Novos recursos têm testes
- [ ] Bugs corrigidos têm testes de regressão
- [ ] Cobertura de código não diminuiu
- [ ] Testes são rápidos (< 1s cada)
- [ ] Testes são independentes (não dependem de ordem)

---

**Desenvolvido com ❤️ para HZ Soluções**
