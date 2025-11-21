# Integração WhatsApp - Hz Soluções

## Status Atual

O backend **já possui um webhook completo** para receber e processar mensagens do WhatsApp. O código está implementado em `apps/server/src/routes/whatsapp.ts` e suporta:

### Comandos Implementados

| Comando | Descrição | Exemplo |
|---------|-----------|---------|
| `gasto [valor] [descrição]` | Registra uma despesa | `gasto 50 mercado` |
| `receita [valor] [descrição]` | Registra uma receita | `receita 5000 salário` |
| `saldo` | Mostra resumo financeiro do mês | `saldo` |
| `despesas` | Lista últimas 5 despesas | `despesas` |
| `itens` | Lista itens pendentes | `itens` |
| `item [nome] [preço]` | Adiciona item à lista | `item leite 5.50` |
| `agua [ml]` | Registra consumo de água | `agua 200` |
| `ajuda` | Mostra lista de comandos | `ajuda` |

### Funcionalidades Implementadas

- ✅ Parser de comandos em linguagem natural
- ✅ Auto-categorização de despesas (Alimentação, Transporte, Saúde, Contas, Outros)
- ✅ Criação automática de usuários via WhatsApp
- ✅ Respostas formatadas com emojis
- ✅ Suporte para WhatsApp Business API (Meta)
- ✅ Webhook de verificação

## Provedores Suportados

### 1. WhatsApp Business API (Meta) - IMPLEMENTADO

O código atual está preparado para a API oficial do Meta/Facebook.

**Variáveis de Ambiente Necessárias:**
```bash
WHATSAPP_API_VERSION=v20.0
WHATSAPP_PHONE_ID=seu_phone_id
WHATSAPP_ACCESS_TOKEN=seu_token_permanente
WHATSAPP_VERIFY_TOKEN=seu_token_de_verificacao
```

**Endpoints:**
- `GET /whatsapp/webhook` - Verificação do webhook
- `POST /whatsapp/webhook` - Recebimento de mensagens

### 2. Evolution API - RECOMENDADO PARA DESENVOLVIMENTO

A Evolution API é uma solução open-source que facilita a integração com WhatsApp sem necessidade de aprovação do Meta.

#### Instalação da Evolution API

**Opção 1: Docker (Recomendado)**
```bash
docker run -d \
  --name evolution-api \
  -p 8080:8080 \
  -e AUTHENTICATION_API_KEY=sua_chave_secreta \
  atendai/evolution-api:latest
```

**Opção 2: NPM**
```bash
npm install -g evolution-api
evolution-api start
```

#### Configuração no Backend

1. **Criar arquivo de adaptador** (`apps/server/src/routes/whatsapp-evolution.ts`):

```typescript
import express, { Request, Response } from 'express';
import { db } from '../db/index.js';
import { users, transactions, items, waterIntake } from '../db/schema.js';
import { eq, and, gte, lt, desc } from 'drizzle-orm';

const router = express.Router();

// URL da Evolution API
const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || 'http://localhost:8080';
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY;
const EVOLUTION_INSTANCE_NAME = process.env.EVOLUTION_INSTANCE_NAME || 'hzsolucoes';

// Envia mensagem via Evolution API
async function sendEvolutionMessage(to: string, text: string) {
  if (!EVOLUTION_API_KEY) {
    console.warn('EVOLUTION_API_KEY não configurado');
    return;
  }

  const url = `${EVOLUTION_API_URL}/message/sendText/${EVOLUTION_INSTANCE_NAME}`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': EVOLUTION_API_KEY,
      },
      body: JSON.stringify({
        number: to,
        text: text,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Erro ao enviar mensagem Evolution:', error);
    }
  } catch (error) {
    console.error('Erro na requisição Evolution:', error);
  }
}

// Webhook para receber mensagens da Evolution API
router.post('/webhook/evolution', async (req: Request, res: Response) => {
  try {
    const { data } = req.body;
    
    // Evolution API envia mensagens no formato:
    // { data: { key: { remoteJid: "5511999999999@s.whatsapp.net" }, message: { conversation: "texto" } } }
    
    const from = data?.key?.remoteJid?.replace('@s.whatsapp.net', '');
    const body = data?.message?.conversation || 
                 data?.message?.extendedTextMessage?.text ||
                 '';
    
    if (!from || !body) {
      return res.status(400).json({ error: 'Missing from or body' });
    }

    // Aqui você pode reutilizar toda a lógica de processamento de comandos
    // do arquivo whatsapp.ts original
    
    // ... (copiar lógica de processamento de comandos)
    
    res.json({ success: true });
  } catch (error: any) {
    console.error('Erro no webhook Evolution:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
```

2. **Adicionar rota no `index.ts`:**

```typescript
import whatsappEvolutionRouter from './routes/whatsapp-evolution.js';

// ...

app.use('/whatsapp', whatsappEvolutionRouter);
```

3. **Configurar variáveis de ambiente** (`.env`):

```bash
# Evolution API
EVOLUTION_API_URL=http://localhost:8080
EVOLUTION_API_KEY=sua_chave_secreta
EVOLUTION_INSTANCE_NAME=hzsolucoes
```

#### Conectar WhatsApp na Evolution API

1. Acesse `http://localhost:8080/manager`
2. Crie uma nova instância com o nome `hzsolucoes`
3. Escaneie o QR Code com seu WhatsApp
4. Configure o webhook para apontar para seu backend:
   - URL: `https://seu-backend.com/whatsapp/webhook/evolution`
   - Events: `messages.upsert`

## Testando Localmente

### 1. Usar ngrok para expor o backend

```bash
# Instalar ngrok
npm install -g ngrok

# Expor porta 3000
ngrok http 3000
```

Copie a URL gerada (ex: `https://abc123.ngrok.io`) e configure como webhook na Evolution API.

### 2. Testar comandos

Envie mensagens para o número conectado na Evolution API:

```
gasto 50 mercado
receita 5000 salário
saldo
despesas
agua 200
ajuda
```

## Deploy em Produção

### Opção 1: Evolution API + Render.com

1. **Deploy da Evolution API:**
   - Use o Docker da Evolution API no Render
   - Configure as variáveis de ambiente

2. **Deploy do Backend:**
   - Já está configurado no `render.yaml`
   - Adicione as variáveis de ambiente da Evolution API

3. **Conectar WhatsApp:**
   - Acesse o manager da Evolution API
   - Escaneie o QR Code
   - Configure o webhook

### Opção 2: WhatsApp Business API (Meta)

1. **Criar conta no Meta Business:**
   - Acesse https://business.facebook.com
   - Configure o WhatsApp Business API

2. **Obter credenciais:**
   - Phone ID
   - Access Token (permanente)
   - Verify Token

3. **Configurar webhook:**
   - URL: `https://seu-backend.com/whatsapp/webhook`
   - Verify Token: o mesmo configurado no `.env`

4. **Adicionar variáveis de ambiente:**
   ```bash
   WHATSAPP_API_VERSION=v20.0
   WHATSAPP_PHONE_ID=seu_phone_id
   WHATSAPP_ACCESS_TOKEN=seu_token
   WHATSAPP_VERIFY_TOKEN=seu_verify_token
   ```

## Próximos Passos

1. ✅ Webhook implementado
2. ⏳ Escolher provedor (Evolution API ou Meta)
3. ⏳ Configurar instância do WhatsApp
4. ⏳ Testar comandos
5. ⏳ Deploy em produção
6. ⏳ Adicionar mais comandos (opcional):
   - `meta [nome] [valor]` - Criar meta
   - `contas` - Listar contas bancárias
   - `relatorio` - Gerar relatório mensal

## Recursos Adicionais

- [Evolution API - Documentação](https://doc.evolution-api.com/)
- [WhatsApp Business API - Meta](https://developers.facebook.com/docs/whatsapp)
- [Baileys - Biblioteca WhatsApp](https://github.com/WhiskeySockets/Baileys)
