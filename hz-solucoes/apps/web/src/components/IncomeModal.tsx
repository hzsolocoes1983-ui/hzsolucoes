import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { incomeSchema, IncomeFormData } from '../lib/schemas';
import { Modal } from './ui/modal';
import { Button } from './ui/button';
import { formatCurrencyInput, parseBrazilianNumber } from '../lib/utils';

interface IncomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { amount: number; description: string }) => void;
  isLoading?: boolean;
}

export function IncomeModal({ isOpen, onClose, onSubmit, isLoading }: IncomeModalProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<IncomeFormData>({
    resolver: zodResolver(incomeSchema),
    defaultValues: {
      amount: '',
      description: '',
    },
  });

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCurrencyInput(e.target.value);
    setValue('amount', formatted);
  };

  const handleFormSubmit = (data: IncomeFormData) => {
    const amount = parseBrazilianNumber(data.amount);
    onSubmit({
      amount,
      description: data.description,
    });
    reset();
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Adicionar Receita">
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        {/* Campo Valor */}
        <div>
          <label htmlFor="income-amount" className="block text-sm font-medium mb-1">
            Valor *
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
              R$
            </span>
            <input
              id="income-amount"
              type="text"
              {...register('amount')}
              onChange={handleAmountChange}
              placeholder="0,00"
              className={`w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                errors.amount
                  ? 'border-red-500 focus:ring-red-500'
                  : 'border-gray-300 focus:ring-green-500'
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
          <label htmlFor="income-description" className="block text-sm font-medium mb-1">
            Descrição *
          </label>
          <input
            id="income-description"
            type="text"
            {...register('description')}
            placeholder="Ex: Salário, Freelance, Venda"
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
              errors.description
                ? 'border-red-500 focus:ring-red-500'
                : 'border-gray-300 focus:ring-green-500'
            }`}
            disabled={isLoading}
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
          )}
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
