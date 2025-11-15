import { initTRPC } from '@trpc/server';
import { z } from 'zod';

const t = initTRPC.create();
export const router = t.router({
  login: t.procedure
    .input(z.object({ whatsapp: z.string(), password: z.string() }))
    .mutation(async ({ input }) => {
      return {
        token: 'mock-token',
        user: { whatsapp: input.whatsapp, name: 'Usuário' }
      };
    }),
  register: t.procedure
    .input(z.object({ whatsapp: z.string(), name: z.string(), password: z.string() }))
    .mutation(async () => {
      return;
    }),
  getGoals: t.procedure
    .query(async () => {
      return [
        { id: 1, name: 'Reserva', targetAmount: 100000, currentAmount: 35000 },
        { id: 2, name: 'Viagem', targetAmount: 50000, currentAmount: 22000 },
        { id: 3, name: 'Reforma', targetAmount: 80000, currentAmount: 12000 },
      ];
    }),
  getMonthlyTotal: t.procedure
    .input(z.object({ year: z.number(), month: z.number() }))
    .query(async () => {
      return 6500; // entradas do mês
    }),
  getMonthlyExpensesTotal: t.procedure
    .input(z.object({ year: z.number(), month: z.number() }))
    .query(async () => {
      return 3200; // saídas do mês
    }),
});

export type AppRouter = typeof router;