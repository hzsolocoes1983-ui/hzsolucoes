import { initTRPC } from '@trpc/server';
import { z } from 'zod';
import { db } from '../db/index.js';
import { users, goals, transactions, items, dailyCare, waterIntake, accounts } from '../db/schema.js';
import { eq, and, gte, lt, desc, sql } from 'drizzle-orm';

const t = initTRPC.create();

// Auto-categorização baseada em keywords
function categorizeExpense(description: string): string {
  const desc = description.toLowerCase();
  if (desc.includes('mercado') || desc.includes('supermercado') || desc.includes('comida')) return 'Alimentação';
  if (desc.includes('combustível') || desc.includes('gasolina') || desc.includes('posto')) return 'Transporte';
  if (desc.includes('farmacia') || desc.includes('remédio') || desc.includes('medicamento')) return 'Saúde';
  if (desc.includes('conta') || desc.includes('luz') || desc.includes('água') || desc.includes('internet')) return 'Contas';
  if (desc.includes('restaurante') || desc.includes('lanche') || desc.includes('ifood')) return 'Alimentação';
  return 'Outros';
}

export const router = t.router({
  // Autenticação
  login: t.procedure
    .input(z.object({ whatsapp: z.string(), password: z.string() }))
    .mutation(async ({ input }) => {
      const user = await db.select().from(users).where(eq(users.whatsapp, input.whatsapp)).get();
      
      if (!user || user.password !== input.password) {
        throw new Error('Credenciais inválidas');
      }

      return {
        token: 'token-' + user.id,
        user: { whatsapp: user.whatsapp, name: user.name, id: user.id }
      };
    }),

  // Login sem senha (uso familiar)
  // Cria (se necessário) e retorna um usuário padrão
  loginGuest: t.procedure
    .input(z.any()) // Aceita qualquer input (objeto vazio, undefined, null, etc)
    .mutation(async ({ input }) => {
      try {
        const defaultWhatsApp = process.env.DEFAULT_WHATSAPP || 'family@local';
        const defaultName = process.env.DEFAULT_NAME || 'Família';
        const defaultPassword = 'nopass';

        console.log('[loginGuest] Iniciando login guest...', { defaultWhatsApp });

        let user = await db.select().from(users).where(eq(users.whatsapp, defaultWhatsApp)).get();
        console.log('[loginGuest] Usuário encontrado:', user ? 'sim' : 'não');

        if (!user) {
          console.log('[loginGuest] Criando novo usuário...');
          await db.insert(users).values({
            whatsapp: defaultWhatsApp,
            name: defaultName,
            password: defaultPassword,
            createdAt: new Date(),
          });
          user = await db.select().from(users).where(eq(users.whatsapp, defaultWhatsApp)).get();
          console.log('[loginGuest] Usuário criado:', user ? 'sim' : 'não');
        }

        if (!user) {
          throw new Error('Falha ao criar usuário padrão');
        }

        const result = {
          token: 'token-' + user.id,
          user: { whatsapp: user.whatsapp, name: user.name, id: user.id }
        };
        console.log('[loginGuest] Login bem-sucedido:', result.user.name);
        return result;
      } catch (error: any) {
        console.error('[loginGuest] Erro:', error);
        throw error;
      }
    }),

  register: t.procedure
    .input(z.object({ whatsapp: z.string(), name: z.string(), password: z.string() }))
    .mutation(async ({ input }) => {
      try {
        await db.insert(users).values({
          whatsapp: input.whatsapp,
          name: input.name,
          password: input.password,
          createdAt: new Date(),
        });
      } catch (error: any) {
        if (error.message?.includes('UNIQUE')) {
          throw new Error('WhatsApp já cadastrado');
        }
        throw error;
      }
    }),

  // Transações
  addTransaction: t.procedure
    .input(z.object({
      userId: z.number(),
      type: z.enum(['income', 'expense']),
      amount: z.number(),
      description: z.string().optional(),
      category: z.string().optional(),
      isFixed: z.boolean().optional(),
      date: z.union([z.date(), z.string()]).optional().transform((val) => {
        if (!val) return new Date();
        if (typeof val === 'string') return new Date(val);
        return val;
      }),
    }))
    .mutation(async ({ input }) => {
      const category = input.type === 'expense' && input.description
        ? categorizeExpense(input.description)
        : input.category;

      await db.insert(transactions).values({
        userId: input.userId,
        type: input.type,
        amount: input.amount,
        description: input.description,
        category,
        isFixed: input.isFixed || false,
        date: input.date || new Date(),
        createdAt: new Date(),
      });
    }),

  getTransactions: t.procedure
    .input(z.object({
      userId: z.number(),
      year: z.number().optional(),
      month: z.number().optional(),
      type: z.enum(['income', 'expense']).optional(),
    }))
    .query(async ({ input }) => {
      const conditions = [eq(transactions.userId, input.userId)];

      if (input.year && input.month) {
        const startDate = new Date(input.year, input.month - 1, 1);
        const endDate = new Date(input.year, input.month, 0, 23, 59, 59);
        conditions.push(gte(transactions.date, startDate));
        conditions.push(lt(transactions.date, endDate));
      }

      if (input.type) {
        conditions.push(eq(transactions.type, input.type));
      }

      const result = await db.select()
        .from(transactions)
        .where(and(...conditions))
        .orderBy(desc(transactions.date))
        .all();
      
      return result;
    }),

  updateTransaction: t.procedure
    .input(z.object({
      id: z.number(),
      userId: z.number(),
      type: z.enum(['income', 'expense']).optional(),
      amount: z.number().optional(),
      description: z.string().optional(),
      category: z.string().optional(),
      isFixed: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, userId, ...updates } = input;
      
      // Verifica se a transação pertence ao usuário
      const transaction = await db.select()
        .from(transactions)
        .where(and(eq(transactions.id, id), eq(transactions.userId, userId)))
        .get();
      
      if (!transaction) {
        throw new Error('Transação não encontrada');
      }

      await db.update(transactions)
        .set(updates)
        .where(eq(transactions.id, id));
    }),

  deleteTransaction: t.procedure
    .input(z.object({
      id: z.number(),
      userId: z.number(),
    }))
    .mutation(async ({ input }) => {
      // Verifica se a transação pertence ao usuário
      const transaction = await db.select()
        .from(transactions)
        .where(and(eq(transactions.id, input.id), eq(transactions.userId, input.userId)))
        .get();
      
      if (!transaction) {
        throw new Error('Transação não encontrada');
      }

      await db.delete(transactions)
        .where(eq(transactions.id, input.id));
    }),

  // Metas
  getGoals: t.procedure
    .input(z.object({ userId: z.number().optional() }))
    .query(async ({ input }) => {
      let allGoals;
      if (input.userId) {
        allGoals = await db.select().from(goals).where(eq(goals.userId, input.userId)).all();
      } else {
        allGoals = await db.select().from(goals).all();
      }
      return allGoals.map(g => ({
        id: g.id,
        name: g.name,
        targetAmount: g.targetAmount,
        currentAmount: g.currentAmount,
      }));
    }),

  addGoal: t.procedure
    .input(z.object({
      userId: z.number(),
      name: z.string(),
      targetAmount: z.number(),
    }))
    .mutation(async ({ input }) => {
      await db.insert(goals).values({
        userId: input.userId,
        name: input.name,
        targetAmount: input.targetAmount,
        currentAmount: 0,
        createdAt: new Date(),
      });
    }),

  // Itens
  getItems: t.procedure
    .input(z.object({ userId: z.number(), status: z.enum(['pending', 'bought']).optional() }))
    .query(async ({ input }) => {
      const conditions = [eq(items.userId, input.userId)];
      if (input.status) {
        conditions.push(eq(items.status, input.status));
      }
      return await db.select().from(items).where(and(...conditions)).all();
    }),

  addItem: t.procedure
    .input(z.object({
      userId: z.number(),
      name: z.string(),
      price: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      await db.insert(items).values({
        userId: input.userId,
        name: input.name,
        status: 'pending',
        price: input.price,
        createdAt: new Date(),
      });
    }),

  updateItemStatus: t.procedure
    .input(z.object({
      id: z.number(),
      status: z.enum(['pending', 'bought']),
    }))
    .mutation(async ({ input }) => {
      await db.update(items)
        .set({ status: input.status })
        .where(eq(items.id, input.id));
    }),

  // Resumo Financeiro
  getMonthlyTotal: t.procedure
    .input(z.object({ year: z.number(), month: z.number(), userId: z.number().optional() }))
    .query(async ({ input }) => {
      const startDate = new Date(input.year, input.month - 1, 1);
      const endDate = new Date(input.year, input.month, 0, 23, 59, 59);
      
      const conditions = [
        eq(transactions.type, 'income'),
        gte(transactions.date, startDate),
        lt(transactions.date, endDate)
      ];

      if (input.userId) {
        conditions.push(eq(transactions.userId, input.userId));
      }

      const income = await db.select()
        .from(transactions)
        .where(and(...conditions))
        .all();
      
      const total = income.reduce((sum, t) => sum + t.amount, 0);
      return total;
    }),

  getMonthlyExpensesTotal: t.procedure
    .input(z.object({ year: z.number(), month: z.number(), userId: z.number().optional() }))
    .query(async ({ input }) => {
      const startDate = new Date(input.year, input.month - 1, 1);
      const endDate = new Date(input.year, input.month, 0, 23, 59, 59);
      
      const conditions = [
        eq(transactions.type, 'expense'),
        gte(transactions.date, startDate),
        lt(transactions.date, endDate)
      ];

      if (input.userId) {
        conditions.push(eq(transactions.userId, input.userId));
      }

      const expenses = await db.select()
        .from(transactions)
        .where(and(...conditions))
        .all();
      
      const total = expenses.reduce((sum, t) => sum + t.amount, 0);
      return total;
    }),

  getFixedExpenses: t.procedure
    .input(z.object({ userId: z.number().optional() }))
    .query(async ({ input }) => {
      const conditions = [
        eq(transactions.type, 'expense'),
        eq(transactions.isFixed, true)
      ];

      if (input.userId) {
        conditions.push(eq(transactions.userId, input.userId));
      }

      return await db.select()
        .from(transactions)
        .where(and(...conditions))
        .all();
    }),

  // Relatórios
  getExpensesByCategory: t.procedure
    .input(z.object({ year: z.number(), month: z.number(), userId: z.number().optional() }))
    .query(async ({ input }) => {
      const startDate = new Date(input.year, input.month - 1, 1);
      const endDate = new Date(input.year, input.month, 0, 23, 59, 59);
      
      const conditions = [
        eq(transactions.type, 'expense'),
        gte(transactions.date, startDate),
        lt(transactions.date, endDate)
      ];

      if (input.userId) {
        conditions.push(eq(transactions.userId, input.userId));
      }

      return await db.select({
        category: transactions.category,
        total: sql<number>`SUM(${transactions.amount})`,
      })
        .from(transactions)
        .where(and(...conditions))
        .groupBy(transactions.category)
        .all();
    }),

  getExpensesByUser: t.procedure
    .input(z.object({ year: z.number(), month: z.number() }))
    .query(async ({ input }) => {
      const startDate = new Date(input.year, input.month - 1, 1);
      const endDate = new Date(input.year, input.month, 0, 23, 59, 59);
      
      const result = await db.select({
        userId: transactions.userId,
        userName: users.name,
        total: sql<number>`SUM(${transactions.amount})`,
      })
        .from(transactions)
        .innerJoin(users, eq(transactions.userId, users.id))
        .where(
          and(
            eq(transactions.type, 'expense'),
            gte(transactions.date, startDate),
            lt(transactions.date, endDate)
          )
        )
        .groupBy(transactions.userId, users.name)
        .all();

      return result;
    }),

  // Cuidados do Dia
  getDailyCare: t.procedure
    .input(z.object({
      userId: z.number(),
      date: z.union([z.date(), z.string()]).optional().transform((val) => {
        if (!val) return new Date();
        if (typeof val === 'string') return new Date(val);
        return val;
      }),
      type: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const targetDate = input.date || new Date();
      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);

      const conditions = [
        eq(dailyCare.userId, input.userId),
        gte(dailyCare.date, startOfDay),
        lt(dailyCare.date, endOfDay)
      ];

      if (input.type) {
        conditions.push(eq(dailyCare.type, input.type));
      }

      return await db.select()
        .from(dailyCare)
        .where(and(...conditions))
        .all();
    }),

  markDailyCare: t.procedure
    .input(z.object({
      userId: z.number(),
      type: z.string(),
      scheduledTime: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      await db.insert(dailyCare).values({
        userId: input.userId,
        type: input.type,
        scheduledTime: input.scheduledTime,
        completed: true,
        date: new Date(),
        createdAt: new Date(),
      });
    }),

  getWaterIntake: t.procedure
    .input(z.object({
      userId: z.number(),
      date: z.union([z.date(), z.string()]).optional().transform((val) => {
        if (!val) return new Date();
        if (typeof val === 'string') return new Date(val);
        return val;
      }),
    }))
    .query(async ({ input }) => {
      const targetDate = input.date || new Date();
      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);

      const intakes = await db.select()
        .from(waterIntake)
        .where(
          and(
            eq(waterIntake.userId, input.userId),
            gte(waterIntake.date, startOfDay),
            lt(waterIntake.date, endOfDay)
          )
        )
        .all();

      const total = intakes.reduce((sum, i) => sum + i.amount, 0);
      return { total, intakes };
    }),

  addWaterIntake: t.procedure
    .input(z.object({
      userId: z.number(),
      amount: z.number(),
    }))
    .mutation(async ({ input }) => {
      await db.insert(waterIntake).values({
        userId: input.userId,
        amount: input.amount,
        date: new Date(),
        createdAt: new Date(),
      });
    }),

  // Contas Bancárias
  getAccounts: t.procedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ input }) => {
      return await db.select()
        .from(accounts)
        .where(eq(accounts.userId, input.userId))
        .all();
    }),

  addAccount: t.procedure
    .input(z.object({
      userId: z.number(),
      name: z.string(),
      type: z.enum(['checking', 'savings', 'investment']),
      balance: z.number().optional(),
      icon: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      await db.insert(accounts).values({
        userId: input.userId,
        name: input.name,
        type: input.type,
        balance: input.balance || 0,
        icon: input.icon,
        createdAt: new Date(),
      });
    }),

  updateAccount: t.procedure
    .input(z.object({
      id: z.number(),
      userId: z.number(),
      name: z.string().optional(),
      balance: z.number().optional(),
      icon: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, userId, ...updates } = input;
      
      // Verifica se a conta pertence ao usuário
      const account = await db.select()
        .from(accounts)
        .where(and(eq(accounts.id, id), eq(accounts.userId, userId)))
        .get();
      
      if (!account) {
        throw new Error('Conta não encontrada');
      }

      await db.update(accounts)
        .set(updates)
        .where(eq(accounts.id, id));
    }),

  deleteAccount: t.procedure
    .input(z.object({
      id: z.number(),
      userId: z.number(),
    }))
    .mutation(async ({ input }) => {
      // Verifica se a conta pertence ao usuário
      const account = await db.select()
        .from(accounts)
        .where(and(eq(accounts.id, input.id), eq(accounts.userId, input.userId)))
        .get();
      
      if (!account) {
        throw new Error('Conta não encontrada');
      }

      await db.delete(accounts)
        .where(eq(accounts.id, input.id));
    }),
});

export type AppRouter = typeof router;
