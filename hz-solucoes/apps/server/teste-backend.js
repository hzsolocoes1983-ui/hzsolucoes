// Teste Simples do Backend
// Execute: node teste-backend.js

const BASE_URL = 'http://localhost:3000';

async function teste(nome, funcao) {
  try {
    console.log(`\n🧪 Testando: ${nome}...`);
    const resultado = await funcao();
    console.log(`✅ ${nome}: PASSOU`);
    if (resultado) {
      console.log(`   Resultado:`, JSON.stringify(resultado).substring(0, 100));
    }
    return true;
  } catch (error) {
    console.log(`❌ ${nome}: FALHOU`);
    console.log(`   Erro:`, error.message);
    return false;
  }
}

async function main() {
  console.log('========================================');
  console.log('   TESTE AUTOMATICO DO BACKEND');
  console.log('========================================');
  console.log('\n⚠️  Certifique-se de que o backend está rodando!');
  console.log('   Execute: npm run dev\n');

  let passou = 0;
  let falhou = 0;

  // Teste 1: Health Check
  const teste1 = await teste('Health Check', async () => {
    const response = await fetch(`${BASE_URL}/health`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    if (data.status !== 'ok') throw new Error('Status não é "ok"');
    return data;
  });
  if (teste1) passou++; else falhou++;

  // Teste 2: Login Guest
  const teste2 = await teste('Login Guest', async () => {
    const response = await fetch(`${BASE_URL}/trpc/loginGuest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: 1, json: {} })
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`HTTP ${response.status}: ${text}`);
    }
    const data = await response.json();
    // tRPC retorna em formato específico
    if (Array.isArray(data) && data[0]?.result?.data?.json) {
      return data[0].result.data.json;
    }
    return data;
  });
  if (teste2) passou++; else falhou++;

  // Teste 3: Adicionar Transação (precisa de userId válido)
  const teste3 = await teste('Adicionar Transação', async () => {
    // Primeiro faz login para pegar userId
    const loginResponse = await fetch(`${BASE_URL}/trpc/loginGuest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: 1, json: {} })
    });
    const loginData = await loginResponse.json();
    let userId = 1; // fallback
    
    if (Array.isArray(loginData) && loginData[0]?.result?.data?.json?.user?.id) {
      userId = loginData[0].result.data.json.user.id;
    }

    const response = await fetch(`${BASE_URL}/trpc/addTransaction`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: 2,
        json: {
          userId: userId,
          type: 'expense',
          amount: 50.00,
          description: 'Teste automatizado'
        }
      })
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`HTTP ${response.status}: ${text}`);
    }
    return { success: true };
  });
  if (teste3) passou++; else falhou++;

  // Resumo
  console.log('\n========================================');
  console.log('   RESULTADO FINAL');
  console.log('========================================');
  console.log(`✅ Passou: ${passou}`);
  console.log(`❌ Falhou: ${falhou}`);
  console.log(`📊 Total: ${passou + falhou}`);
  
  if (falhou === 0) {
    console.log('\n🎉 TODOS OS TESTES PASSARAM!');
    console.log('   O backend está funcionando perfeitamente!');
  } else {
    console.log('\n⚠️  Alguns testes falharam.');
    console.log('   Verifique se o backend está rodando corretamente.');
  }
  console.log('\n');
}

// Verifica se fetch está disponível (Node.js 18+)
if (typeof fetch === 'undefined') {
  console.error('❌ Erro: Este script precisa do Node.js 18 ou superior');
  console.error('   Ou instale: npm install node-fetch');
  process.exit(1);
}

main().catch(console.error);

