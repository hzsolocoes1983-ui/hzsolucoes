/**
 * Script de Testes Completo - HZ Soluções
 * Testa todas as funcionalidades CRUD do sistema
 */

const BASE_URL = process.env.TRPC_URL || 'http://localhost:3000/trpc';

// Helper para fazer chamadas tRPC
async function trpcCall<T>(procedure: string, input: any): Promise<T> {
  const url = `${BASE_URL}/${procedure}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify([{ id: 1, json: input }]),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`HTTP ${response.status}: ${text}`);
  }

  const data = await response.json();
  
  // tRPC retorna: [{ result: { data: { json: T } } }]
  if (Array.isArray(data) && data.length > 0 && data[0]?.result) {
    const result = data[0].result;
    if (result.error) {
      throw new Error(result.error.message || JSON.stringify(result.error));
    }
    if (result.data?.json !== undefined) {
      return result.data.json as T;
    }
    if (result.data !== undefined) {
      return result.data as T;
    }
  }
  
  return data as T;
}

// Cores para output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(name: string) {
  log(`\n🧪 ${name}`, 'cyan');
}

function logSuccess(message: string) {
  log(`  ✅ ${message}`, 'green');
}

function logError(message: string) {
  log(`  ❌ ${message}`, 'red');
}

function logInfo(message: string) {
  log(`  ℹ️  ${message}`, 'blue');
}

// Contadores
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

async function runTest(name: string, testFn: () => Promise<void>) {
  totalTests++;
  try {
    await testFn();
    passedTests++;
    logSuccess(`${name}`);
  } catch (error: any) {
    failedTests++;
    logError(`${name}: ${error.message}`);
  }
}

// ============================================
// TESTES
// ============================================

async function testLoginGuest() {
  logTest('1. Login Guest');
  
  await runTest('Login sem credenciais', async () => {
    const result = await trpcCall<{ token: string; user: any }>('loginGuest', {});
    if (!result.token || !result.user) {
      throw new Error('Token ou usuário não retornados');
    }
    logInfo(`Token: ${result.token}`);
    logInfo(`Usuário: ${result.user.name} (ID: ${result.user.id})`);
  });
}

async function testTransactions() {
  logTest('2. Transações Financeiras');
  let userId: number;
  
  // Obter usuário
  await runTest('Obter usuário para testes', async () => {
    const result = await trpcCall<{ token: string; user: any }>('loginGuest', {});
    userId = result.user.id;
    logInfo(`Usando usuário ID: ${userId}`);
  });

  // Adicionar receita
  await runTest('Adicionar receita', async () => {
    await trpcCall('addTransaction', {
      userId,
      type: 'income',
      amount: 5000,
      description: 'Salário teste',
    });
    logInfo('Receita de R$ 5.000,00 adicionada');
  });

  // Adicionar despesa
  await runTest('Adicionar despesa', async () => {
    await trpcCall('addTransaction', {
      userId,
      type: 'expense',
      amount: 150.50,
      description: 'Mercado teste',
    });
    logInfo('Despesa de R$ 150,50 adicionada');
  });

  // Adicionar despesa fixa
  await runTest('Adicionar despesa fixa', async () => {
    await trpcCall('addTransaction', {
      userId,
      type: 'expense',
      amount: 500,
      description: 'Aluguel',
      isFixed: true,
    });
    logInfo('Despesa fixa de R$ 500,00 adicionada');
  });

  // Listar transações
  await runTest('Listar transações do mês', async () => {
    const now = new Date();
    const transactions = await trpcCall<any[]>('getTransactions', {
      userId,
      year: now.getFullYear(),
      month: now.getMonth() + 1,
    });
    if (transactions.length === 0) {
      throw new Error('Nenhuma transação encontrada');
    }
    logInfo(`Encontradas ${transactions.length} transações`);
  });

  // Resumo mensal
  await runTest('Obter resumo financeiro mensal', async () => {
    const now = new Date();
    const [income, expenses] = await Promise.all([
      trpcCall<number>('getMonthlyTotal', {
        userId,
        year: now.getFullYear(),
        month: now.getMonth() + 1,
      }),
      trpcCall<number>('getMonthlyExpensesTotal', {
        userId,
        year: now.getFullYear(),
        month: now.getMonth() + 1,
      }),
    ]);
    logInfo(`Receitas: R$ ${income.toFixed(2)}`);
    logInfo(`Despesas: R$ ${expenses.toFixed(2)}`);
    logInfo(`Saldo: R$ ${(income - expenses).toFixed(2)}`);
  });

  // Despesas fixas
  await runTest('Listar despesas fixas', async () => {
    const fixed = await trpcCall<any[]>('getFixedExpenses', { userId });
    logInfo(`Encontradas ${fixed.length} despesas fixas`);
  });

  // Despesas por categoria
  await runTest('Obter despesas por categoria', async () => {
    const now = new Date();
    const byCategory = await trpcCall<any[]>('getExpensesByCategory', {
      userId,
      year: now.getFullYear(),
      month: now.getMonth() + 1,
    });
    logInfo(`Categorias encontradas: ${byCategory.length}`);
    byCategory.forEach((cat: any) => {
      logInfo(`  - ${cat.category || 'Sem categoria'}: R$ ${Number(cat.total).toFixed(2)}`);
    });
  });
}

async function testGoals() {
  logTest('3. Metas Financeiras');
  let userId: number;
  
  await runTest('Obter usuário', async () => {
    const result = await trpcCall<{ token: string; user: any }>('loginGuest', {});
    userId = result.user.id;
  });

  // Criar meta
  await runTest('Criar meta financeira', async () => {
    await trpcCall('addGoal', {
      userId,
      name: 'Viagem para Europa',
      targetAmount: 10000,
    });
    logInfo('Meta "Viagem para Europa" criada (R$ 10.000,00)');
  });

  // Listar metas
  await runTest('Listar metas do usuário', async () => {
    const goals = await trpcCall<any[]>('getGoals', { userId });
    if (goals.length === 0) {
      throw new Error('Nenhuma meta encontrada');
    }
    logInfo(`Encontradas ${goals.length} meta(s)`);
    goals.forEach((goal: any) => {
      logInfo(`  - ${goal.name}: R$ ${goal.currentAmount.toFixed(2)} / R$ ${goal.targetAmount.toFixed(2)}`);
    });
  });
}

async function testItems() {
  logTest('4. Lista de Compras');
  let userId: number;
  
  await runTest('Obter usuário', async () => {
    const result = await trpcCall<{ token: string; user: any }>('loginGuest', {});
    userId = result.user.id;
  });

  // Adicionar item
  await runTest('Adicionar item à lista', async () => {
    await trpcCall('addItem', {
      userId,
      name: 'Leite',
      price: 5.50,
    });
    logInfo('Item "Leite" adicionado (R$ 5,50)');
  });

  await runTest('Adicionar item sem preço', async () => {
    await trpcCall('addItem', {
      userId,
      name: 'Pão',
    });
    logInfo('Item "Pão" adicionado (sem preço)');
  });

  // Listar itens
  await runTest('Listar itens pendentes', async () => {
    const items = await trpcCall<any[]>('getItems', {
      userId,
      status: 'pending',
    });
    logInfo(`Encontrados ${items.length} item(s) pendente(s)`);
  });

  // Atualizar status
  await runTest('Marcar item como comprado', async () => {
    const items = await trpcCall<any[]>('getItems', {
      userId,
      status: 'pending',
    });
    if (items.length > 0) {
      await trpcCall('updateItemStatus', {
        id: items[0].id,
        status: 'bought',
      });
      logInfo(`Item "${items[0].name}" marcado como comprado`);
    } else {
      logInfo('Nenhum item pendente para marcar');
    }
  });

  // Listar todos os itens
  await runTest('Listar todos os itens', async () => {
    const items = await trpcCall<any[]>('getItems', { userId });
    logInfo(`Total de itens: ${items.length}`);
  });
}

async function testDailyCare() {
  logTest('5. Cuidados Diários');
  let userId: number;
  
  await runTest('Obter usuário', async () => {
    const result = await trpcCall<{ token: string; user: any }>('loginGuest', {});
    userId = result.user.id;
  });

  // Marcar cuidado
  await runTest('Marcar cuidado (hormônios)', async () => {
    await trpcCall('markDailyCare', {
      userId,
      type: 'hormones',
      scheduledTime: '07:00',
    });
    logInfo('Cuidado "hormônios" marcado');
  });

  await runTest('Marcar cuidado (exercício)', async () => {
    await trpcCall('markDailyCare', {
      userId,
      type: 'exercise',
      scheduledTime: '18:00',
    });
    logInfo('Cuidado "exercício" marcado');
  });

  // Listar cuidados do dia
  await runTest('Listar cuidados do dia', async () => {
    const today = new Date();
    const care = await trpcCall<any[]>('getDailyCare', {
      userId,
      date: today.toISOString(),
    });
    logInfo(`Encontrados ${care.length} cuidado(s) hoje`);
    care.forEach((c: any) => {
      logInfo(`  - ${c.type}: ${c.completed ? '✓' : '○'}`);
    });
  });
}

async function testWaterIntake() {
  logTest('6. Consumo de Água');
  let userId: number;
  
  await runTest('Obter usuário', async () => {
    const result = await trpcCall<{ token: string; user: any }>('loginGuest', {});
    userId = result.user.id;
  });

  // Adicionar água
  await runTest('Registrar consumo de água (200ml)', async () => {
    await trpcCall('addWaterIntake', {
      userId,
      amount: 200,
    });
    logInfo('200ml de água registrado');
  });

  await runTest('Registrar consumo de água (500ml)', async () => {
    await trpcCall('addWaterIntake', {
      userId,
      amount: 500,
    });
    logInfo('500ml de água registrado');
  });

  // Consultar total do dia
  await runTest('Consultar total de água do dia', async () => {
    const today = new Date();
    const water = await trpcCall<{ total: number; intakes: any[] }>('getWaterIntake', {
      userId,
      date: today.toISOString(),
    });
    logInfo(`Total hoje: ${water.total}ml`);
    logInfo(`Registros: ${water.intakes.length}`);
    const percentage = ((water.total / 2000) * 100).toFixed(0);
    logInfo(`Progresso: ${percentage}% da meta (2000ml)`);
  });
}

// ============================================
// EXECUÇÃO
// ============================================

async function main() {
  log('\n╔══════════════════════════════════════════════════════════╗', 'cyan');
  log('║                                                          ║', 'cyan');
  log('║   🧪 TESTES COMPLETOS - HZ SOLUÇÕES                     ║', 'cyan');
  log('║                                                          ║', 'cyan');
  log('╚══════════════════════════════════════════════════════════╝', 'cyan');
  
  log(`\n🔗 Conectando em: ${BASE_URL}`, 'yellow');

  try {
    // Verificar se o servidor está rodando
    const healthCheck = await fetch(`${BASE_URL.replace('/trpc', '')}/health`);
    if (!healthCheck.ok) {
      throw new Error('Servidor não está respondendo. Certifique-se de que o backend está rodando!');
    }
    logSuccess('Servidor está rodando!');
  } catch (error: any) {
    logError(`Erro ao conectar: ${error.message}`);
    log('\n💡 Dica: Inicie o servidor com:', 'yellow');
    log('   cd hz-solucoes/apps/server && npm run dev', 'yellow');
    process.exit(1);
  }

  // Executar todos os testes
  await testLoginGuest();
  await testTransactions();
  await testGoals();
  await testItems();
  await testDailyCare();
  await testWaterIntake();

  // Resumo final
  log('\n╔══════════════════════════════════════════════════════════╗', 'cyan');
  log('║                    RESUMO DOS TESTES                    ║', 'cyan');
  log('╚══════════════════════════════════════════════════════════╝', 'cyan');
  log(`\n📊 Total de testes: ${totalTests}`, 'blue');
  log(`✅ Passou: ${passedTests}`, 'green');
  log(`❌ Falhou: ${failedTests}`, 'red');
  
  const passRate = ((passedTests / totalTests) * 100).toFixed(1);
  log(`\n📈 Taxa de sucesso: ${passRate}%`, passRate === '100.0' ? 'green' : 'yellow');
  
  if (failedTests === 0) {
    log('\n🎉 Todos os testes passaram!', 'green');
  } else {
    log('\n⚠️  Alguns testes falharam. Revise os erros acima.', 'yellow');
  }
  
  process.exit(failedTests > 0 ? 1 : 0);
}

main().catch((error) => {
  logError(`Erro fatal: ${error.message}`);
  process.exit(1);
});


