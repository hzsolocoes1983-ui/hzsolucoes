import express, { Request, Response } from 'express';
import { db } from '../db/index.js';
import { users, transactions, items, dailyCare, waterIntake } from '../db/schema.js';
import { eq, and, gte, lt, desc } from 'drizzle-orm';

const router = express.Router();

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
    const { from, body } = req.body;
    
    if (!from || !body) {
      return res.status(400).json({ error: 'Missing from or body' });
    }

    // Busca ou cria usuário pelo WhatsApp
    let user = await db.select().from(users).where(eq(users.whatsapp, from)).get();
    
    if (!user) {
      // Cria usuário automaticamente se não existir
      const result = await db.insert(users).values({
        whatsapp: from,
        name: from.split('@')[0], // Nome padrão
        password: 'whatsapp-auth', // Senha padrão para WhatsApp
        createdAt: new Date(),
      }).returning();
      user = result[0];
    }

    const { command, args } = parseCommand(body);
    let response = '';

    switch (command) {
      case 'gasto':
      case 'despesa':
        if (args.length < 1) {
          response = '❌ Formato: gasto [valor] [descrição]\nExemplo: gasto 50 mercado';
        } else {
          const amount = parseFloat(args[0]);
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

          response = `✅ Despesa registrada!\n💰 R$ ${amount.toFixed(2)}\n📝 ${description}\n🏷️ ${category}`;
        }
        break;

      case 'receita':
      case 'ganho':
        if (args.length < 1) {
          response = '❌ Formato: receita [valor] [descrição]\nExemplo: receita 5000 salário';
        } else {
          const amount = parseFloat(args[0]);
          const description = args.slice(1).join(' ') || 'Sem descrição';

          await db.insert(transactions).values({
            userId: user.id,
            type: 'income',
            amount,
            description,
            date: new Date(),
            createdAt: new Date(),
          });

          response = `✅ Receita registrada!\n💰 R$ ${amount.toFixed(2)}\n📝 ${description}`;
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

        response = `📊 *Resumo Financeiro - ${month}/${year}*\n\n`;
        response += `💰 Receitas: R$ ${totalIncome.toFixed(2)}\n`;
        response += `💸 Despesas: R$ ${totalExpenses.toFixed(2)}\n`;
        response += `\n${balance >= 0 ? '✅' : '❌'} Saldo: R$ ${balance.toFixed(2)}`;
        break;

      case 'despesas':
        const recentExpenses = await db.select()
          .from(transactions)
          .where(
            and(
              eq(transactions.userId, user.id),
              eq(transactions.type, 'expense')
            )
          )
          .orderBy(desc(transactions.date))
          .limit(5)
          .all();

        if (recentExpenses.length === 0) {
          response = '📝 Nenhuma despesa registrada ainda.';
        } else {
          response = '📝 *Últimas Despesas:*\n\n';
          recentExpenses.forEach((exp, idx) => {
            const date = new Date(exp.date).toLocaleDateString('pt-BR');
            response += `${idx + 1}. R$ ${exp.amount.toFixed(2)} - ${exp.description || 'Sem descrição'}\n   ${date}\n\n`;
          });
        }
        break;

      case 'itens':
        const pendingItems = await db.select()
          .from(items)
          .where(
            and(
              eq(items.userId, user.id),
              eq(items.status, 'pending')
            )
          )
          .all();

        if (pendingItems.length === 0) {
          response = '📋 Nenhum item pendente.';
        } else {
          response = `📋 *Itens Pendentes (${pendingItems.length}):*\n\n`;
          pendingItems.forEach((item, idx) => {
            response += `${idx + 1}. ${item.name}`;
            if (item.price) {
              response += ` - R$ ${item.price.toFixed(2)}`;
            }
            response += '\n';
          });
        }
        break;

      case 'item':
      case 'adicionar':
        if (args.length < 1) {
          response = '❌ Formato: item [nome] [preço opcional]\nExemplo: item leite 5.50';
        } else {
          const itemName = args[0];
          const price = args[1] ? parseFloat(args[1]) : null;

          await db.insert(items).values({
            userId: user.id,
            name: itemName,
            status: 'pending',
            price,
            createdAt: new Date(),
          });

          response = `✅ Item adicionado!\n📋 ${itemName}${price ? ` - R$ ${price.toFixed(2)}` : ''}`;
        }
        break;

      case 'agua':
      case 'água':
        const amount = args[0] ? parseFloat(args[0]) : 200;

        await db.insert(waterIntake).values({
          userId: user.id,
          amount,
          date: new Date(),
          createdAt: new Date(),
        });

        // Busca total do dia
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

        response = `💧 +${amount}ml adicionado!\n\n`;
        response += `📊 Total hoje: ${totalToday}ml / ${goal}ml\n`;
        response += `📈 ${((totalToday / goal) * 100).toFixed(0)}% da meta`;
        break;

      case 'ajuda':
      case 'help':
        response = `📱 *Comandos Disponíveis:*\n\n`;
        response += `💰 *gasto [valor] [descrição]*\n   Adiciona uma despesa\n   Ex: gasto 50 mercado\n\n`;
        response += `💵 *receita [valor] [descrição]*\n   Adiciona uma receita\n   Ex: receita 5000 salário\n\n`;
        response += `📊 *saldo*\n   Ver resumo financeiro do mês\n\n`;
        response += `📝 *despesas*\n   Ver últimas 5 despesas\n\n`;
        response += `📋 *itens*\n   Ver itens pendentes\n\n`;
        response += `➕ *item [nome] [preço]*\n   Adicionar item à lista\n   Ex: item leite 5.50\n\n`;
        response += `💧 *agua [ml]*\n   Registrar consumo de água\n   Ex: agua 200\n\n`;
        response += `❓ *ajuda*\n   Ver esta mensagem`;
        break;

      default:
        response = `❓ Comando não reconhecido: "${command}"\n\nDigite *ajuda* para ver os comandos disponíveis.`;
    }

    // Aqui você enviaria a resposta de volta para o WhatsApp
    // Por enquanto, apenas retorna a resposta
    res.json({ 
      success: true, 
      response,
      user: { id: user.id, name: user.name, whatsapp: user.whatsapp }
    });

  } catch (error: any) {
    console.error('Erro no webhook WhatsApp:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;

