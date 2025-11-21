/**
 * Script de teste para o endpoint loginGuest
 * Testa se o login guest está funcionando após a migração de senhas
 */

const PORT = process.env.PORT || 3000;
const BASE_URL = `http://localhost:${PORT}`;

async function testLoginGuest() {
  console.log('🧪 Testando loginGuest...\n');
  
  try {
    const url = `${BASE_URL}/trpc/loginGuest`;
    console.log(`📡 URL: ${url}`);
    console.log(`📤 Enviando requisição POST com body: {}\n`);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({})
    });
    
    console.log(`📥 Status: ${response.status} ${response.statusText}`);
    
    const text = await response.text();
    console.log(`📄 Response (raw):\n${text}\n`);
    
    if (!response.ok) {
      console.error('❌ Erro na requisição!');
      return false;
    }
    
    const data = JSON.parse(text);
    console.log('✅ Resposta parseada:', JSON.stringify(data, null, 2));
    
    // Verifica o formato da resposta
    if (data.result?.data) {
      const loginData = data.result.data;
      if (loginData.token && loginData.user) {
        console.log('\n✅ Login bem-sucedido!');
        console.log(`   Token: ${loginData.token.substring(0, 20)}...`);
        console.log(`   Usuário: ${loginData.user.name} (${loginData.user.whatsapp})`);
        return true;
      }
    }
    
    console.warn('⚠️  Formato de resposta inesperado');
    return false;
    
  } catch (error) {
    console.error('❌ Erro ao testar:', error.message);
    return false;
  }
}

async function testHealth() {
  console.log('🏥 Testando health check...\n');
  
  try {
    const response = await fetch(`${BASE_URL}/health`);
    const data = await response.json();
    console.log('✅ Health check OK:', data);
    return true;
  } catch (error) {
    console.error('❌ Servidor não está respondendo:', error.message);
    console.log('\n💡 Dica: Inicie o servidor com: npm run dev');
    return false;
  }
}

// Executa os testes
async function runTests() {
  console.log('🚀 Iniciando testes do backend...\n');
  console.log('='.repeat(50));
  console.log('\n');
  
  const healthOk = await testHealth();
  if (!healthOk) {
    process.exit(1);
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('\n');
  
  const loginOk = await testLoginGuest();
  
  console.log('\n' + '='.repeat(50));
  console.log('\n📊 Resultado Final:');
  console.log(`   Health Check: ${healthOk ? '✅' : '❌'}`);
  console.log(`   Login Guest: ${loginOk ? '✅' : '❌'}`);
  console.log('\n');
  
  process.exit(loginOk ? 0 : 1);
}

runTests();
