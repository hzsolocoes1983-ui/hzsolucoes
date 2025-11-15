import { initTRPC } from '@trpc/server';
import { z } from 'zod';
import { db } from '../db/index.js';
import { users, goals, transactions } from '../db/schema.js';
import { eq, and, gte, lt } from 'drizzle-orm';

const t = initTRPC.create();
export const router = t.router({
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
  getGoals: t.procedure
    .query(async () => {
      const allGoals = await db.select().from(goals).all();
      return allGoals.map(g => ({
        id: g.id,
        name: g.name,
        targetAmount: g.targetAmount,
        currentAmount: g.currentAmount,
      }));
    }),
  getMonthlyTotal: t.procedure
    .input(z.object({ year: z.number(), month: z.number() }))
    .query(async ({ input }) => {
      const startDate = new Date(input.year, input.month - 1, 1);
      const endDate = new Date(input.year, input.month, 0, 23, 59, 59);
      
      const income = await db.select()
        .from(transactions)
        .where(
          and(
            eq(transactions.type, 'income'),
            gte(transactions.date, startDate),
            lt(transactions.date, endDate)
          )
        )
        .all();
      
      const total = income.reduce((sum, t) => sum + t.amount, 0);
      return total;
    }),
  getMonthlyExpensesTotal: t.procedure
    .input(z.object({ year: z.number(), month: z.number() }))
    .query(async ({ input }) => {
      const startDate = new Date(input.year, input.month - 1, 1);
      const endDate = new Date(input.year, input.month, 0, 23, 59, 59);
      
      const expenses = await db.select()
        .from(transactions)
        .where(
          and(
            eq(transactions.type, 'expense'),
            gte(transactions.date, startDate),
            lt(transactions.date, endDate)
          )
        )
        .all();
      
      const total = expenses.reduce((sum, t) => sum + t.amount, 0);
      return total;
    }),
});

export type AppRouter = typeof router;