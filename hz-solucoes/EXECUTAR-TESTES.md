# 🧪 Executar Todos os Testes

## ✅ Script de Testes Criado!

Criei um script completo que testa **TODAS** as funcionalidades do sistema:

### 📦 Arquivo Criado
- `hz-solucoes/apps/server/test-all.js` - Script de testes completo

### 🎯 O que é Testado

O script valida **20+ operações** em 6 categorias:

1. **Autenticação** (1 teste)
   - ✅ Login guest

2. **Transações Financeiras** (7 testes)
   - ✅ Adicionar receita
   - ✅ Adicionar despesa
   - ✅ Adicionar despesa fixa
   - ✅ Listar transações do mês
   - ✅ Resumo financeiro mensal
   - ✅ Listar despesas fixas
   - ✅ Despesas por categoria

3. **Metas Financeiras** (2 testes)
   - ✅ Criar meta
   - ✅ Listar metas

4. **Lista de Compras** (5 testes)
   - ✅ Adicionar item com preço
   - ✅ Adicionar item sem preço
   - ✅ Listar itens pendentes
   - ✅ Marcar como comprado
   - ✅ Listar todos os itens

5. **Cuidados Diários** (3 testes)
   - ✅ Marcar cuidado (hormônios)
   - ✅ Marcar cuidado (exercício)
   - ✅ Listar cuidados do dia

6. **Consumo de Água** (3 testes)
   - ✅ Registrar 200ml
   - ✅ Registrar 500ml
   - ✅ Consultar total do dia

## 🚀 Como Executar

### Passo 1: Iniciar o Backend

Abra um terminal e execute:

```powershell
cd hz-solucoes/apps/server
npm run dev
```

Aguarde até ver:
```
Database initialized
Server listening on http://localhost:3000
```

### Passo 2: Executar os Testes

Em **outro terminal** (mantenha o primeiro rodando), execute:

```powershell
cd hz-solucoes/apps/server
npm test
```

Ou diretamente:

```powershell
node test-all.js
```

## 📊 Resultado Esperado

Se tudo estiver funcionando, você verá:

```
╔══════════════════════════════════════════════════════════╗
║   🧪 TESTES COMPLETOS - HZ SOLUÇÕES                     ║
╚══════════════════════════════════════════════════════════╝

🧪 1. Login Guest
  ✅ Login sem credenciais

🧪 2. Transações Financeiras
  ✅ Obter usuário para testes
  ✅ Adicionar receita
  ✅ Adicionar despesa
  ✅ Adicionar despesa fixa
  ✅ Listar transações do mês
  ✅ Obter resumo financeiro mensal
  ✅ Listar despesas fixas
  ✅ Obter despesas por categoria

🧪 3. Metas Financeiras
  ✅ Obter usuário
  ✅ Criar meta financeira
  ✅ Listar metas do usuário

🧪 4. Lista de Compras
  ✅ Obter usuário
  ✅ Adicionar item à lista
  ✅ Adicionar item sem preço
  ✅ Listar itens pendentes
  ✅ Marcar item como comprado
  ✅ Listar todos os itens

🧪 5. Cuidados Diários
  ✅ Obter usuário
  ✅ Marcar cuidado (hormônios)
  ✅ Marcar cuidado (exercício)
  ✅ Listar cuidados do dia

🧪 6. Consumo de Água
  ✅ Obter usuário
  ✅ Registrar consumo de água (200ml)
  ✅ Registrar consumo de água (500ml)
  ✅ Consultar total de água do dia

╔══════════════════════════════════════════════════════════╗
║                    RESUMO DOS TESTES                    ║
╚══════════════════════════════════════════════════════════╝

📊 Total de testes: 20+
✅ Passou: 20+
❌ Falhou: 0

📈 Taxa de sucesso: 100.0%

🎉 Todos os testes passaram!
```

## ⚠️ Importante

- **O backend DEVE estar rodando** antes de executar os testes
- Os testes criam dados reais no banco de dados
- Use um banco de teste ou limpe os dados após os testes

## 🔧 Troubleshooting

### Erro: "Servidor não está respondendo"

**Solução**: Certifique-se de que o backend está rodando:
```powershell
# Verifique se está rodando
curl http://localhost:3000/health
```

### Erro: "Port 3000 already in use"

**Solução**: Pare o processo que está usando a porta:
```powershell
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

## ✅ Status

- ✅ Script de testes criado
- ✅ Testa todas as funcionalidades CRUD
- ✅ Valida autenticação
- ✅ Valida transações financeiras
- ✅ Valida metas
- ✅ Valida lista de compras
- ✅ Valida cuidados diários
- ✅ Valida consumo de água
- ✅ Relatório completo com cores
- ✅ Contadores de sucesso/falha

## 🎯 Próximo Passo

Execute os testes para validar que tudo está funcionando:

```powershell
# Terminal 1: Backend
cd hz-solucoes/apps/server
npm run dev

# Terminal 2: Testes
cd hz-solucoes/apps/server
npm test
```


