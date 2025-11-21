import { useForm, UseFormProps } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

/**
 * Hook customizado para validação de formulários com Zod
 * 
 * @example
 * const schema = z.object({
 *   amount: z.number().positive('Valor deve ser positivo'),
 *   description: z.string().min(3, 'Descrição muito curta'),
 * });
 * 
 * const { register, handleSubmit, formState: { errors } } = useFormValidation(schema);
 */
export function useFormValidation<T extends z.ZodType<any, any>>(
  schema: T,
  options?: Omit<UseFormProps<z.infer<T>>, 'resolver'>
) {
  return useForm<z.infer<T>>({
    resolver: zodResolver(schema),
    ...options,
  });
}

// Schemas de validação comuns
export const transactionSchema = z.object({
  amount: z.string()
    .min(1, 'Valor é obrigatório')
    .refine((val) => {
      const num = parseFloat(val.replace(',', '.'));
      return !isNaN(num) && num > 0;
    }, 'Valor deve ser um número positivo'),
  description: z.string()
    .min(3, 'Descrição deve ter pelo menos 3 caracteres')
    .max(200, 'Descrição muito longa (máximo 200 caracteres)'),
  isFixed: z.boolean().optional(),
});

export const itemSchema = z.object({
  name: z.string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100, 'Nome muito longo (máximo 100 caracteres)'),
  price: z.string()
    .optional()
    .refine((val) => {
      if (!val || val === '') return true;
      const num = parseFloat(val.replace(',', '.'));
      return !isNaN(num) && num >= 0;
    }, 'Preço inválido'),
});

export const goalSchema = z.object({
  name: z.string()
    .min(3, 'Nome deve ter pelo menos 3 caracteres')
    .max(100, 'Nome muito longo (máximo 100 caracteres)'),
  targetAmount: z.string()
    .min(1, 'Valor alvo é obrigatório')
    .refine((val) => {
      const num = parseFloat(val.replace(',', '.'));
      return !isNaN(num) && num > 0;
    }, 'Valor deve ser um número positivo'),
  currentAmount: z.string()
    .optional()
    .refine((val) => {
      if (!val || val === '') return true;
      const num = parseFloat(val.replace(',', '.'));
      return !isNaN(num) && num >= 0;
    }, 'Valor atual inválido'),
});

export const loginSchema = z.object({
  whatsapp: z.string()
    .min(10, 'WhatsApp inválido')
    .max(15, 'WhatsApp inválido'),
  password: z.string()
    .min(4, 'Senha deve ter pelo menos 4 caracteres'),
});
