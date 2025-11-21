import { z } from 'zod';

/**
 * Schemas de validação para formulários
 * Usando Zod para validação type-safe
 */

// Schema para despesas
export const expenseSchema = z.object({
  amount: z
    .string()
    .min(1, 'Valor é obrigatório')
    .refine(
      (val) => {
        const num = parseFloat(val.replace(/\./g, '').replace(',', '.'));
        return !isNaN(num) && num > 0;
      },
      { message: 'Valor deve ser maior que zero' }
    ),
  description: z
    .string()
    .min(3, 'Descrição deve ter pelo menos 3 caracteres')
    .max(100, 'Descrição deve ter no máximo 100 caracteres'),
  category: z.string().optional(),
  isFixed: z.boolean().optional(),
});

export type ExpenseFormData = z.infer<typeof expenseSchema>;

// Schema para receitas
export const incomeSchema = z.object({
  amount: z
    .string()
    .min(1, 'Valor é obrigatório')
    .refine(
      (val) => {
        const num = parseFloat(val.replace(/\./g, '').replace(',', '.'));
        return !isNaN(num) && num > 0;
      },
      { message: 'Valor deve ser maior que zero' }
    ),
  description: z
    .string()
    .min(3, 'Descrição deve ter pelo menos 3 caracteres')
    .max(100, 'Descrição deve ter no máximo 100 caracteres'),
});

export type IncomeFormData = z.infer<typeof incomeSchema>;

// Schema para itens da lista de compras
export const itemSchema = z.object({
  name: z
    .string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(50, 'Nome deve ter no máximo 50 caracteres'),
  price: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val || val.trim() === '') return true; // Preço é opcional
        const num = parseFloat(val.replace(/\./g, '').replace(',', '.'));
        return !isNaN(num) && num > 0;
      },
      { message: 'Preço deve ser maior que zero' }
    ),
});

export type ItemFormData = z.infer<typeof itemSchema>;

// Schema para contas bancárias
export const accountSchema = z.object({
  name: z
    .string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(30, 'Nome deve ter no máximo 30 caracteres'),
  type: z.enum(['checking', 'savings', 'investment'], {
    errorMap: () => ({ message: 'Tipo de conta inválido' }),
  }),
  balance: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val || val.trim() === '') return true; // Saldo inicial é opcional
        const num = parseFloat(val.replace(/\./g, '').replace(',', '.'));
        return !isNaN(num);
      },
      { message: 'Saldo inválido' }
    ),
  icon: z.string().optional(),
});

export type AccountFormData = z.infer<typeof accountSchema>;

// Schema para metas financeiras
export const goalSchema = z.object({
  name: z
    .string()
    .min(3, 'Nome deve ter pelo menos 3 caracteres')
    .max(50, 'Nome deve ter no máximo 50 caracteres'),
  targetAmount: z
    .string()
    .min(1, 'Valor da meta é obrigatório')
    .refine(
      (val) => {
        const num = parseFloat(val.replace(/\./g, '').replace(',', '.'));
        return !isNaN(num) && num > 0;
      },
      { message: 'Valor deve ser maior que zero' }
    ),
  currentAmount: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val || val.trim() === '') return true;
        const num = parseFloat(val.replace(/\./g, '').replace(',', '.'));
        return !isNaN(num) && num >= 0;
      },
      { message: 'Valor atual inválido' }
    ),
});

export type GoalFormData = z.infer<typeof goalSchema>;

// Schema para login
export const loginSchema = z.object({
  whatsapp: z
    .string()
    .min(10, 'WhatsApp deve ter pelo menos 10 dígitos')
    .regex(/^[0-9+\s()-]+$/, 'WhatsApp deve conter apenas números'),
  password: z
    .string()
    .min(4, 'Senha deve ter pelo menos 4 caracteres'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

// Schema para registro
export const registerSchema = z.object({
  whatsapp: z
    .string()
    .min(10, 'WhatsApp deve ter pelo menos 10 dígitos')
    .regex(/^[0-9+\s()-]+$/, 'WhatsApp deve conter apenas números'),
  name: z
    .string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(50, 'Nome deve ter no máximo 50 caracteres'),
  password: z
    .string()
    .min(6, 'Senha deve ter pelo menos 6 caracteres')
    .regex(/[A-Z]/, 'Senha deve conter pelo menos uma letra maiúscula')
    .regex(/[0-9]/, 'Senha deve conter pelo menos um número'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'As senhas não coincidem',
  path: ['confirmPassword'],
});

export type RegisterFormData = z.infer<typeof registerSchema>;
