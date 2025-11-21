import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { expenseSchema, ExpenseFormData } from '../lib/schemas';
import { Modal } from './ui/modal';
import { Button } from './ui/button';
import { formatCurrencyInput, parseBrazilianNumber } from '../lib/utils';

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { amount: number; description: string; isFixed?: boolean }) => void;
  isLoading?: boolean;
}

export function ExpenseModal({ isOpen, onClose, onSubmit, isLoading }: ExpenseModalProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      amount: '',
      description: '',
      isFixed: false,
    },
  });

  const amountValue = watch('amount');

  // Formata o valor enquanto o usuário digita
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCurrencyInput(e.target.value);
    setValue('amount', formatted);
  };

  const handleFormSubmit = (data: ExpenseFormData) => {
    const amount = parseBrazilianNumber(data.amount);
    onSubmit({
      amount,
      description: data.description,
      isFixed: data.isFixed,
    });
    reset();
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Adicionar Despesa">
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        {/* Campo Valor */}
        <div>
          <label htmlFor="amount" className="block text-sm font-medium mb-1">
            Valor *
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
              R$
            </span>
            <input
              id="amount"
              type="text"
              {...register('amount')}
              onChange={handleAmountChange}
              placeholder="0,00"
              className={`w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                errors.amount
                  ? 'border-red-500 focus:ring-red-500'
                  : 'border-gray-300 focus:ring-blue-500'
              }`}
              disabled={isLoading}
            />
          </div>
          {errors.amount && (
            <p className="mt-1 text-sm text-red-600">{errors.amount.message}</p>
          )}
        </div>

        {/* Campo Descrição */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium mb-1">
            Descrição *
          </label>
          <input
            id="description"
            type="text"
            {...register('description')}
            placeholder="Ex: Compras do mercado"
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
              errors.description
                ? 'border-red-500 focus:ring-red-500'
                : 'border-gray-300 focus:ring-blue-500'
            }`}
            disabled={isLoading}
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
          )}
        </div>

        {/* Checkbox Despesa Fixa */}
        <div className="flex items-center">
          <input
            id="isFixed"
            type="checkbox"
            {...register('isFixed')}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            disabled={isLoading}
          />
          <label htmlFor="isFixed" className="ml-2 text-sm">
            Despesa fixa mensal
          </label>
        </div>

        {/* Botões */}
        <div className="flex gap-2 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading} className="flex-1">
            {isLoading ? 'Salvando...' : 'Adicionar'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
