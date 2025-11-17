# 🧪 Como Executar Todos os Testes

Este documento explica como executar o script de testes completo que valida todas as funcionalidades do sistema.

## 📋 Pré-requisitos

1. **Backend rodando**: O servidor deve estar em execução na porta 3000
2. **Node.js**: Versão 18 ou superior (com suporte a `fetch` nativo)

## 🚀 Passo a Passo

### 1. Iniciar o Backend

Abra um terminal e execute:

```bash
cd hz-solucoes/apps/server
npm run dev
```

Aguarde até ver:
```
Database initialized
Server listening on http://localhost:3000
```

### 2. Executar os Testes

Em **outro terminal**, execute:

```bash
cd hz-solucoes/apps/server
npm test
```

Ou diretamente:

```bash
node test-all.js
```

## 📊 O que é Testado

O script testa **todas as funcionalidades CRUD** do sistema:

### ✅ 1. Autenticação
- Login guest (sem credenciais)

### ✅ 2. Transações Financeiras
- Adicionar receita
- Adicionar despesa
- Adicionar despesa fixa
- Listar transações do mês
- Obter resumo financeiro mensal
- Listar despesas fixas
- Obter despesas por categoria

### ✅ 3. Metas Financeiras
- Criar meta financeira
- Listar metas do usuário

### ✅ 4. Lista de Compras
- Adicionar item com preço
- Adicionar item sem preço
- Listar itens pendentes
- Marcar item como comprado
- Listar todos os itens

### ✅ 5. Cuidados Diários
- Marcar cuidado (hormônios)
- Marcar cuidado (exercício)
- Listar cuidados do dia

### ✅ 6. Consumo de Água
- Registrar consumo de água (200ml)
- Registrar consumo de água (500ml)
- Consultar total de água do dia

## 📈 Resultado Esperado

Se tudo estiver funcionando, você verá:

```
╔══════════════════════════════════════════════════════════╗
║                    RESUMO DOS TESTES                    ║
╚══════════════════════════════════════════════════════════╝

📊 Total de testes: 20+
✅ Passou: 20+
❌ Falhou: 0

📈 Taxa de sucesso: 100.0%

🎉 Todos os testes passaram!
```

## 🔧 Troubleshooting

### Erro: "Servidor não está respondendo"

**Solução**: Certifique-se de que o backend está rodando:
```bash
# Verifique se está rodando
curl http://localhost:3000/health
```

### Erro: "Cannot find module 'fetch'"

**Solução**: Use Node.js 18+ ou instale `node-fetch`:
```bash
npm install node-fetch
```

### Erro: "Port 3000 already in use"

**Solução**: Pare o processo que está usando a porta:
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:3000 | xargs kill
```

## 📝 Notas

- Os testes criam dados reais no banco de dados
- Use um banco de teste ou limpe os dados após os testes
- O script usa o usuário padrão criado pelo `loginGuest`

## 🎯 Próximos Passos

Após todos os testes passarem:
1. ✅ Sistema funcional - **COMPLETO**
2. ⏭️ Integração WhatsApp (Fase 2)
3. ⏭️ Segurança (Fase 3)


