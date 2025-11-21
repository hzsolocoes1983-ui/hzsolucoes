import express, { Request, Response } from 'express';
import { db } from '../db/index.js';
import { users, transactions, items, dailyCare, waterIntake } from '../db/schema.js';
import { eq, and, gte, lt, desc } from 'drizzle-orm';
import { whatsappService } from '../services/whatsapp.js';

const router = express.Router();

// Configuração para WhatsApp Business Cloud API (Meta) - mantido para compatibilidade
const META_API_VERSION = process.env.WHATSAPP_API_VERSION || 'v20.0';
const WHATSAPP_PHONE_ID = process.env.WHATSAPP_PHONE_ID;
const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const WHATSAPP_VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN;

// Verificação de webhook (Meta)
router.get('/webhook', (req: Request, res: Response) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  console.log('[Webhook] Verificação recebida:', { mode, token: token ? '***' : 'missing', challenge });

  if (!WHATSAPP_VERIFY_TOKEN) {
    console.warn('[Webhook] WHATSAPP_VERIFY_TOKEN não configurado - aceitando qualquer token (desenvolvimento)');
    if (mode === 'subscribe' && challenge) {
      return res.status(200).send(challenge);
    }
  } else {
    if (mode === 'subscribe' && token === WHATSAPP_VERIFY_TOKEN) {
      console.log('[Webhook] Verificação bem-sucedida');
      return res.status(200).send(challenge);
    }
  }
  
  console.log('[Webhook] Verificação falhou');
  return res.sendStatus(403);
});

// Envia mensagem de texto pelo WhatsApp (Meta) - mantido para compatibilidade
async function sendWhatsAppText(to: string, text: string) {
  if (!WHATSAPP_PHONE_ID || !WHATSAPP_ACCESS_TOKEN) {
    console.warn('[WhatsApp] Meta API não configurada, usando Evolution API');
    return await whatsappService.sendMessage(to, text);
  }
  
  const url = `https://graph.facebook.com/${META_API_VERSION}/${WHATSAPP_PHONE_ID}/messages`;
  const payload = {
    messaging_product: 'whatsapp',
    to,
    type: 'text',
    text: { body: text },
  };
  
  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
    },
    body: JSON.stringify(payload),
  });
  
  if (!resp.ok) {
    const err = await resp.text();
    console.error('[WhatsApp] Falha ao enviar via Meta API:', resp.status, err);
    // Fallback para Evolution API
    return await whatsappService.sendMessage(to, text);
  }
}

// Extrai { from, body } do payload do Meta ou Evolution API
function extractMessage(req: Request): { from: string; body: string } | null {
  // Tenta extrair do formato Meta
  const entry = (req.body?.entry || [])[0];
  const changes = (entry?.changes || [])[0];
  const value = changes?.value;
  const messages = value?.messages;
  const contacts = value?.contacts;
  
  if (messages && messages[0] && contacts && contacts[0]) {
    const msg = messages[0];
    const from = contacts[0].wa_id;
    let body = '';
    
    if (msg.type === 'text') {
      body = msg.text?.body || '';
    } else if (msg.type === 'interactive') {
      body = msg.interactive?.button_reply?.title || msg.interactive?.list_reply?.title || '';
    }
    
    return { from, body };
  }
  
  // Tenta extrair do formato Evolution API
  if (req.body?.data) {
    const data = req.body.data;
    const from = data.key?.remoteJid || data.from;
    const body = data.message?.conversation || 
                 data.message?.extendedTextMessage?.text ||
                 data.body;
    
    if (from && body) {
      return { from, body };
    }
  }
  
  // Formato genérico
  const payload = req.body as any;
  const from = payload?.from;
  const body = payload?.body;
  
  if (from && body) {
    return { from, body };
  }
  
  return null;
}

// Parser de comandos do WhatsApp
function parseCommand(message: string): { command: string; args: string[] } {
  const parts = message.trim().toLowerCase().split(/\s+/);
  const command = parts[0];
  const args = parts.slice(1);
  return { command, args };
}

// Auto-categorização
function categorizeExpense(description: string): string {
  const desc = description.toLowerCase();
  if (desc.includes('mercado') || desc.includes('supermercado') || desc.includes('comida')) return 'Alimentação';
  if (desc.includes('combustível') || desc.includes('gasolina') || desc.includes('posto')) return 'Transporte';
  if (desc.includes('farmacia') || desc.includes('remédio') || desc.includes('medicamento')) return 'Saúde';
  if (desc.includes('conta') || desc.includes('luz') || desc.includes('água') || desc.includes('internet')) return 'Contas';
  if (desc.includes('restaurante') || desc.includes('lanche') || desc.includes('ifood')) return 'Alimentação';
  return 'Outros';
}

// Webhook para receber mensagens do WhatsApp
router.post('/webhook', async (req: Request, res: Response) => {
  try {
    console.log('[Webhook] Mensagem recebida:', JSON.stringify(req.body, null, 2));
    
    const extracted = extractMessage(req);
    
    if (!extracted) {
      console.warn('[Webhook] Não foi possível extrair mensagem do payload');
      return res.status(400).json({ error: 'Missing from or body' });
    }
    
    const { from, body } = extracted;
    console.log('[Webhook] Processando mensagem de:', from, 'corpo:', body);

    // Busca ou cria usuário pelo WhatsApp
    let user = await db.select().from(users).where(eq(users.whatsapp, from)).get();
    
    if (!user) {
      console.log('[Webhook] Criando novo usuário para:', from);
      await db.insert(users).values({
        whatsapp: from,
        name: from.split('@')[0],
        password: 'whatsapp-auth',
        createdAt: new Date(),
      });
      user = await db.select().from(users).where(eq(users.whatsapp, from)).get();
      if (!user) {
        return res.status(500).json({ error: 'Failed to create user' });
      }
    }

    const { command, args } = parseCommand(body);
    let response = '';

    switch (command) {
      case 'gasto':
      case 'despesa':
        if (args.length < 1) {
          response = '❌ Formato: despesa [valor] [descrição]\nExemplo: despesa 50 compras';
        } else {
          const amount = parseFloat(args[0].replace(',', '.'));
          const description = args.slice(1).join(' ') || 'Sem descrição';
          const category = categorizeExpense(description);

          await db.insert(transactions).values({
            userId: user.id,
            type: 'expense',
            amount,
            description,
            category,
            isFixed: false,
            date: new Date(),
            createdAt: new Date(),
          });

          response = whatsappService.formatTransactionConfirmation('expense', amount, description);
        }
        break;

      case 'receita':
      case 'ganho':
        if (args.length < 1) {
          response = '❌ Formato: receita [valor] [descrição]\nExemplo: receita 1000 salário';
        } else {
          const amount = parseFloat(args[0].replace(',', '.'));
          const description = args.slice(1).join(' ') || 'Sem descrição';

          await db.insert(transactions).values({
            userId: user.id,
            type: 'income',
            amount,
            description,
            date: new Date(),
            createdAt: new Date(),
          });

          response = whatsappService.formatTransactionConfirmation('income', amount, description);
        }
        break;

      case 'saldo':
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1;
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59);

        const [income, expenses] = await Promise.all([
          db.select().from(transactions).where(
            and(
              eq(transactions.userId, user.id),
              eq(transactions.type, 'income'),
              gte(transactions.date, startDate),
              lt(transactions.date, endDate)
            )
          ).all(),
          db.select().from(transactions).where(
            and(
              eq(transactions.userId, user.id),
              eq(transactions.type, 'expense'),
              gte(transactions.date, startDate),
              lt(transactions.date, endDate)
            )
          ).all(),
        ]);

        const totalIncome = income.reduce((sum, t) => sum + t.amount, 0);
        const totalExpenses = expenses.reduce((sum, t) => sum + t.amount, 0);
        const balance = totalIncome - totalExpenses;

        response = whatsappService.formatSummaryMessage({
          revenue: totalIncome,
          expenses: totalExpenses,
          balance,
        });
        break;

      case 'transacoes':
      case 'transações':
      case 'despesas':
        const recentTransactions = await db.select()
          .from(transactions)
          .where(eq(transactions.userId, user.id))
          .orderBy(desc(transactions.date))
          .limit(10)
          .all();

        response = whatsappService.formatTransactionsList(recentTransactions);
        break;

      case 'lista':
      case 'itens':
      case 'compras':
        const allItems = await db.select()
          .from(items)
          .where(eq(items.userId, user.id))
          .all();

        response = whatsappService.formatShoppingList(allItems);
        break;

      case 'comprar':
      case 'item':
      case 'adicionar':
        if (args.length < 1) {
          response = '❌ Formato: comprar [nome] [preço opcional]\nExemplo: comprar arroz 5kg';
        } else {
          const itemName = args.join(' ');
          const priceMatch = itemName.match(/(\d+[,.]?\d*)\s*$/);
          const price = priceMatch ? parseFloat(priceMatch[1].replace(',', '.')) : null;
          const name = price ? itemName.replace(/\s*\d+[,.]?\d*\s*$/, '') : itemName;

          await db.insert(items).values({
            userId: user.id,
            name,
            status: 'pending',
            price,
            createdAt: new Date(),
          });

          response = `✅ *Item Adicionado*\n\n📋 ${name}${price ? `\n💵 R$ ${price.toFixed(2)}` : ''}`;
        }
        break;

      case 'agua':
      case 'água':
        const waterAmount = args[0] ? parseFloat(args[0]) : 200;

        await db.insert(waterIntake).values({
          userId: user.id,
          amount: waterAmount,
          date: new Date(),
          createdAt: new Date(),
        });

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayEnd = new Date(today);
        todayEnd.setHours(23, 59, 59, 999);

        const todayIntakes = await db.select()
          .from(waterIntake)
          .where(
            and(
              eq(waterIntake.userId, user.id),
              gte(waterIntake.date, today),
              lt(waterIntake.date, todayEnd)
            )
          )
          .all();

        const totalToday = todayIntakes.reduce((sum, i) => sum + i.amount, 0);
        const goal = 2000;

        response = `💧 *Água Registrada*\n\n`;
        response += `+${waterAmount}ml adicionado!\n\n`;
        response += `📊 Total hoje: ${totalToday}ml / ${goal}ml\n`;
        response += `📈 ${((totalToday / goal) * 100).toFixed(0)}% da meta`;
        break;

      case 'ajuda':
      case 'help':
      case 'comandos':
        response = whatsappService.formatHelpMessage();
        break;

      default:
        response = `❓ Comando não reconhecido: "${command}"\n\nDigite *ajuda* para ver os comandos disponíveis.`;
    }

    // Envia a resposta pelo WhatsApp
    console.log('[Webhook] Enviando resposta para:', from);
    try {
      await whatsappService.sendMessage(from, response);
      console.log('[Webhook] Resposta enviada com sucesso');
    } catch (e) {
      console.warn('[Webhook] Erro ao enviar mensagem:', (e as any)?.message || e);
      // Tenta fallback para Meta API
      try {
        await sendWhatsAppText(from, response);
      } catch (e2) {
        console.error('[Webhook] Falha em ambos os métodos de envio');
      }
    }

    res.json({ 
      success: true, 
      response,
      user: { id: user.id, name: user.name, whatsapp: user.whatsapp }
    });

  } catch (error: any) {
    console.error('[Webhook] Erro:', error);
    res.status(500).json({ error: error.message });
  }
});

// Rota de teste para verificar conexão com Evolution API
router.get('/test', async (req: Request, res: Response) => {
  try {
    const isConfigured = whatsappService.isConfigured();
    const isConnected = isConfigured ? await whatsappService.testConnection() : false;
    
    res.json({
      configured: isConfigured,
      connected: isConnected,
      message: isConnected 
        ? '✅ Evolution API configurada e conectada' 
        : '❌ Evolution API não configurada ou desconectada'
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
