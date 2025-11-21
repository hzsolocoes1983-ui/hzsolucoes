import { initTRPC } from '@trpc/server';
import { z } from 'zod';
import { db } from '../db/index.js';
import { users, goals, transactions, items, dailyCare, waterIntake, accounts } from '../db/schema.js';
import { eq, and, gte, lt, desc, sql } from 'drizzle-orm';
import { hashPassword, comparePassword, generateToken, verifyToken } from '../utils/auth.js';

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
  // ==================== AUTENTICAÇÃO ====================
  
  /**
   * Login com WhatsApp e senha
   * Agora usa bcrypt para comparar senhas e JWT para gerar token
   */
  login: t.procedure
    .input(z.object({ whatsapp: z.string(), password: z.string() }))
    .mutation(async ({ input }) => {
      const user = await db.select().from(users).where(eq(users.whatsapp, input.whatsapp)).get();
      
      if (!user) {
        throw new Error('Credenciais inválidas');
      }

      // Comparar senha com hash bcrypt
      const isPasswordValid = await comparePassword(input.password, user.passwordHash);
      
      if (!isPasswordValid) {
        throw new Error('Credenciais inválidas');
      }

      // Gerar token JWT
      const token = generateToken(user.id, user.whatsapp);

      return {
        token,
        user: { whatsapp: user.whatsapp, name: user.name, id: user.id }
      };
    }),

  /**
   * Login sem senha (uso familiar)
   * Cria (se necessário) e retorna um usuário padrão
   * Agora também usa bcrypt e JWT
   */
  loginGuest: t.procedure
    .input(z.any())
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
          
          // Gerar hash da senha padrão
          const passwordHash = await hashPassword(defaultPassword);
          
          await db.insert(users).values({
            whatsapp: defaultWhatsApp,
            name: defaultName,
            passwordHash,
            createdAt: new Date(),
          });
          
          user = await db.select().from(users).where(eq(users.whatsapp, defaultWhatsApp)).get();
          console.log('[loginGuest] Usuário criado:', user ? 'sim' : 'não');
        }

        if (!user) {
          throw new Error('Falha ao criar usuário padrão');
        }

        // Gerar token JWT
        const token = generateToken(user.id, user.whatsapp);

        const result = {
          token,
          user: { whatsapp: user.whatsapp, name: user.name, id: user.id }
        };
        console.log('[loginGuest] Login bem-sucedido:', result.user.name);
        return result;
      } catch (error: any) {
        console.error('[loginGuest] Erro:', error);
        throw error;
      }
    }),

  /**
   * Registro de novo usuário
   * Agora usa bcrypt para hash da senha
   */
  register: t.procedure
    .input(z.object({ whatsapp: z.string(), name: z.string(), password: z.string() }))
    .mutation(async ({ input }) => {
      try {
        // Gerar hash da senha
        const passwordHash = await hashPassword(input.password);
        
        await db.insert(users).values({
          whatsapp: input.whatsapp,
          name: input.name,
          passwordHash,
          createdAt: new Date(),
        });
      } catch (error: any) {
        if (error.message?.includes('UNIQUE')) {
          throw new Error('WhatsApp já cadastrado');
        }
        throw error;
      }
    }),

  // ==================== TRANSAÇÕES ====================
  
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

      return await db.select()
        .from(transactions)
        .where(and(...conditions))
        .orderBy(desc(transactions.date))
        .all();
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
      
      if (updates.type === 'expense' && updates.description) {
        updates.category = categorizeExpense(updates.description);
      }

      await db.update(transactions)
        .set(updates)
        .where(and(eq(transactions.id, id), eq(transactions.userId, userId)))
        .run();
    }),

  deleteTransaction: t.procedure
    .input(z.object({
      id: z.number(),
      userId: z.number(),
    }))
    .mutation(async ({ input }) => {
      await db.delete(transactions)
        .where(and(eq(transactions.id, input.id), eq(transactions.userId, input.userId)))
        .run();
    }),

  getMonthlyTotal: t.procedure
    .input(z.object({
      userId: z.number(),
      year: z.number(),
      month: z.number(),
    }))
    .query(async ({ input }) => {
      const startDate = new Date(input.year, input.month - 1, 1);
      const endDate = new Date(input.year, input.month, 0, 23, 59, 59);

      const result = await db.select({
        total: sql<number>`COALESCE(SUM(${transactions.amount}), 0)`
      })
      .from(transactions)
      .where(and(
        eq(transactions.userId, input.userId),
        eq(transactions.type, 'income'),
        gte(transactions.date, startDate),
        lt(transactions.date, endDate)
      ))
      .get();

      return result?.total || 0;
    }),

  getMonthlyExpensesTotal: t.procedure
    .input(z.object({
      userId: z.number(),
      year: z.number(),
      month: z.number(),
    }))
    .query(async ({ input }) => {
      const startDate = new Date(input.year, input.month - 1, 1);
      const endDate = new Date(input.year, input.month, 0, 23, 59, 59);

      const result = await db.select({
        total: sql<number>`COALESCE(SUM(${transactions.amount}), 0)`
      })
      .from(transactions)
      .where(and(
        eq(transactions.userId, input.userId),
        eq(transactions.type, 'expense'),
        gte(transactions.date, startDate),
        lt(transactions.date, endDate)
      ))
      .get();

      return result?.total || 0;
    }),

  getFixedExpenses: t.procedure
    .input(z.object({
      userId: z.number(),
    }))
    .query(async ({ input }) => {
      return await db.select()
        .from(transactions)
        .where(and(
          eq(transactions.userId, input.userId),
          eq(transactions.type, 'expense'),
          eq(transactions.isFixed, true)
        ))
        .all();
    }),

  getExpensesByCategory: t.procedure
    .input(z.object({
      userId: z.number(),
      year: z.number(),
      month: z.number(),
    }))
    .query(async ({ input }) => {
      const startDate = new Date(input.year, input.month - 1, 1);
      const endDate = new Date(input.year, input.month, 0, 23, 59, 59);

      return await db.select({
        category: transactions.category,
        total: sql<number>`SUM(${transactions.amount})`
      })
      .from(transactions)
      .where(and(
        eq(transactions.userId, input.userId),
        eq(transactions.type, 'expense'),
        gte(transactions.date, startDate),
        lt(transactions.date, endDate)
      ))
      .groupBy(transactions.category)
      .all();
    }),

  getExpensesByUser: t.procedure
    .input(z.object({
      year: z.number(),
      month: z.number(),
    }))
    .query(async ({ input }) => {
      const startDate = new Date(input.year, input.month - 1, 1);
      const endDate = new Date(input.year, input.month, 0, 23, 59, 59);

      return await db.select({
        userId: transactions.userId,
        userName: users.name,
        total: sql<number>`SUM(${transactions.amount})`
      })
      .from(transactions)
      .leftJoin(users, eq(transactions.userId, users.id))
      .where(and(
        eq(transactions.type, 'expense'),
        gte(transactions.date, startDate),
        lt(transactions.date, endDate)
      ))
      .groupBy(transactions.userId)
      .all();
    }),

  // ==================== METAS ====================
  
  addGoal: t.procedure
    .input(z.object({
      userId: z.number(),
      name: z.string(),
      targetAmount: z.number(),
      currentAmount: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      await db.insert(goals).values({
        userId: input.userId,
        name: input.name,
        targetAmount: input.targetAmount,
        currentAmount: input.currentAmount || 0,
        createdAt: new Date(),
      });
    }),

  getGoals: t.procedure
    .input(z.object({
      userId: z.number(),
    }))
    .query(async ({ input }) => {
      return await db.select()
        .from(goals)
        .where(eq(goals.userId, input.userId))
        .all();
    }),

  updateGoal: t.procedure
    .input(z.object({
      id: z.number(),
      userId: z.number(),
      name: z.string().optional(),
      targetAmount: z.number().optional(),
      currentAmount: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, userId, ...updates } = input;
      await db.update(goals)
        .set(updates)
        .where(and(eq(goals.id, id), eq(goals.userId, userId)))
        .run();
    }),

  deleteGoal: t.procedure
    .input(z.object({
      id: z.number(),
      userId: z.number(),
    }))
    .mutation(async ({ input }) => {
      await db.delete(goals)
        .where(and(eq(goals.id, input.id), eq(goals.userId, input.userId)))
        .run();
    }),

  // ==================== ITENS (LISTA DE COMPRAS) ====================
  
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
        price: input.price,
        status: 'pending',
        createdAt: new Date(),
      });
    }),

  getItems: t.procedure
    .input(z.object({
      userId: z.number(),
      status: z.enum(['pending', 'bought']).optional(),
    }))
    .query(async ({ input }) => {
      const conditions = [eq(items.userId, input.userId)];
      
      if (input.status) {
        conditions.push(eq(items.status, input.status));
      }

      return await db.select()
        .from(items)
        .where(and(...conditions))
        .all();
    }),

  updateItemStatus: t.procedure
    .input(z.object({
      id: z.number(),
      userId: z.number(),
      status: z.enum(['pending', 'bought']),
    }))
    .mutation(async ({ input }) => {
      await db.update(items)
        .set({ status: input.status })
        .where(and(eq(items.id, input.id), eq(items.userId, input.userId)))
        .run();
    }),

  deleteItem: t.procedure
    .input(z.object({
      id: z.number(),
      userId: z.number(),
    }))
    .mutation(async ({ input }) => {
      await db.delete(items)
        .where(and(eq(items.id, input.id), eq(items.userId, input.userId)))
        .run();
    }),

  // ==================== CUIDADOS DIÁRIOS ====================
  
  addDailyCare: t.procedure
    .input(z.object({
      userId: z.number(),
      type: z.enum(['hormones', 'medicine', 'food', 'water', 'exercise']),
      scheduledTime: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      await db.insert(dailyCare).values({
        userId: input.userId,
        type: input.type,
        scheduledTime: input.scheduledTime,
        completed: false,
        date: new Date(),
        createdAt: new Date(),
      });
    }),

  getDailyCare: t.procedure
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

      return await db.select()
        .from(dailyCare)
        .where(and(
          eq(dailyCare.userId, input.userId),
          gte(dailyCare.date, startOfDay),
          lt(dailyCare.date, endOfDay)
        ))
        .all();
    }),

  updateDailyCareStatus: t.procedure
    .input(z.object({
      id: z.number(),
      userId: z.number(),
      completed: z.boolean(),
    }))
    .mutation(async ({ input }) => {
      await db.update(dailyCare)
        .set({ completed: input.completed })
        .where(and(eq(dailyCare.id, input.id), eq(dailyCare.userId, input.userId)))
        .run();
    }),

  // ==================== CONSUMO DE ÁGUA ====================
  
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

  getTodayWaterIntake: t.procedure
    .input(z.object({
      userId: z.number(),
    }))
    .query(async ({ input }) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayEnd = new Date(today);
      todayEnd.setHours(23, 59, 59, 999);

      const result = await db.select({
        total: sql<number>`COALESCE(SUM(${waterIntake.amount}), 0)`
      })
      .from(waterIntake)
      .where(and(
        eq(waterIntake.userId, input.userId),
        gte(waterIntake.date, today),
        lt(waterIntake.date, todayEnd)
      ))
      .get();

      return result?.total || 0;
    }),

  // ==================== CONTAS BANCÁRIAS ====================
  
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

  getAccounts: t.procedure
    .input(z.object({
      userId: z.number(),
    }))
    .query(async ({ input }) => {
      return await db.select()
        .from(accounts)
        .where(eq(accounts.userId, input.userId))
        .all();
    }),

  updateAccount: t.procedure
    .input(z.object({
      id: z.number(),
      userId: z.number(),
      name: z.string().optional(),
      type: z.enum(['checking', 'savings', 'investment']).optional(),
      balance: z.number().optional(),
      icon: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, userId, ...updates } = input;
      await db.update(accounts)
        .set(updates)
        .where(and(eq(accounts.id, id), eq(accounts.userId, userId)))
        .run();
    }),

  deleteAccount: t.procedure
    .input(z.object({
      id: z.number(),
      userId: z.number(),
    }))
    .mutation(async ({ input }) => {
      await db.delete(accounts)
        .where(and(eq(accounts.id, input.id), eq(accounts.userId, input.userId)))
        .run();
    }),
});
