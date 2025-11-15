import { initTRPC } from '@trpc/server';
import { z } from 'zod';
import { db } from '../db/index.js';
import { users, goals, transactions, items, dailyCare, waterIntake } from '../db/schema.js';
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
      date: z.date().optional(),
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
      let query = db.select().from(transactions).where(eq(transactions.userId, input.userId));

      if (input.year && input.month) {
        const startDate = new Date(input.year, input.month - 1, 1);
        const endDate = new Date(input.year, input.month, 0, 23, 59, 59);
        query = query.where(
          and(
            eq(transactions.userId, input.userId),
            gte(transactions.date, startDate),
            lt(transactions.date, endDate)
          )
        ) as any;
      }

      if (input.type) {
        query = query.where(eq(transactions.type, input.type)) as any;
      }

      const result = await query.orderBy(desc(transactions.date)).all();
      return result;
    }),

  // Metas
  getGoals: t.procedure
    .input(z.object({ userId: z.number().optional() }))
    .query(async ({ input }) => {
      let query = db.select().from(goals);
      if (input.userId) {
        query = query.where(eq(goals.userId, input.userId)) as any;
      }
      const allGoals = await query.all();
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
      let query = db.select().from(items).where(eq(items.userId, input.userId));
      if (input.status) {
        query = query.where(eq(items.status, input.status)) as any;
      }
      return await query.all();
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
      
      let query = db.select()
        .from(transactions)
        .where(
          and(
            eq(transactions.type, 'income'),
            gte(transactions.date, startDate),
            lt(transactions.date, endDate)
          )
        );

      if (input.userId) {
        query = query.where(eq(transactions.userId, input.userId)) as any;
      }

      const income = await query.all();
      const total = income.reduce((sum, t) => sum + t.amount, 0);
      return total;
    }),

  getMonthlyExpensesTotal: t.procedure
    .input(z.object({ year: z.number(), month: z.number(), userId: z.number().optional() }))
    .query(async ({ input }) => {
      const startDate = new Date(input.year, input.month - 1, 1);
      const endDate = new Date(input.year, input.month, 0, 23, 59, 59);
      
      let query = db.select()
        .from(transactions)
        .where(
          and(
            eq(transactions.type, 'expense'),
            gte(transactions.date, startDate),
            lt(transactions.date, endDate)
          )
        );

      if (input.userId) {
        query = query.where(eq(transactions.userId, input.userId)) as any;
      }

      const expenses = await query.all();
      const total = expenses.reduce((sum, t) => sum + t.amount, 0);
      return total;
    }),

  getFixedExpenses: t.procedure
    .input(z.object({ userId: z.number().optional() }))
    .query(async ({ input }) => {
      let query = db.select()
        .from(transactions)
        .where(
          and(
            eq(transactions.type, 'expense'),
            eq(transactions.isFixed, true)
          )
        );

      if (input.userId) {
        query = query.where(eq(transactions.userId, input.userId)) as any;
      }

      return await query.all();
    }),

  // Relatórios
  getExpensesByCategory: t.procedure
    .input(z.object({ year: z.number(), month: z.number(), userId: z.number().optional() }))
    .query(async ({ input }) => {
      const startDate = new Date(input.year, input.month - 1, 1);
      const endDate = new Date(input.year, input.month, 0, 23, 59, 59);
      
      let query = db.select({
        category: transactions.category,
        total: sql<number>`SUM(${transactions.amount})`,
      })
        .from(transactions)
        .where(
          and(
            eq(transactions.type, 'expense'),
            gte(transactions.date, startDate),
            lt(transactions.date, endDate)
          )
        )
        .groupBy(transactions.category);

      if (input.userId) {
        query = query.where(eq(transactions.userId, input.userId)) as any;
      }

      return await query.all();
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
      date: z.date().optional(),
      type: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const targetDate = input.date || new Date();
      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);

      let query = db.select()
        .from(dailyCare)
        .where(
          and(
            eq(dailyCare.userId, input.userId),
            gte(dailyCare.date, startOfDay),
            lt(dailyCare.date, endOfDay)
          )
        );

      if (input.type) {
        query = query.where(eq(dailyCare.type, input.type)) as any;
      }

      return await query.all();
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
      date: z.date().optional(),
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
});

export type AppRouter = typeof router;
