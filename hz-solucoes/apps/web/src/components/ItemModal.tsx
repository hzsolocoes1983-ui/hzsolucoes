import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { itemSchema, ItemFormData } from '../lib/schemas';
import { Modal } from './ui/modal';
import { Button } from './ui/button';
import { formatCurrencyInput, parseBrazilianNumber } from '../lib/utils';

interface ItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; price?: number }) => void;
  isLoading?: boolean;
}

export function ItemModal({ isOpen, onClose, onSubmit, isLoading }: ItemModalProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<ItemFormData>({
    resolver: zodResolver(itemSchema),
    defaultValues: {
      name: '',
      price: '',
    },
  });

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCurrencyInput(e.target.value);
    setValue('price', formatted);
  };

  const handleFormSubmit = (data: ItemFormData) => {
    const price = data.price && data.price.trim() !== '' 
      ? parseBrazilianNumber(data.price) 
      : undefined;
    
    onSubmit({
      name: data.name,
      price,
    });
    reset();
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Adicionar Item">
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        {/* Campo Nome */}
        <div>
          <label htmlFor="item-name" className="block text-sm font-medium mb-1">
            Nome do Item *
          </label>
          <input
            id="item-name"
            type="text"
            {...register('name')}
            placeholder="Ex: Arroz 5kg, Feijão, Macarrão"
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
              errors.name
                ? 'border-red-500 focus:ring-red-500'
                : 'border-gray-300 focus:ring-blue-500'
            }`}
            disabled={isLoading}
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
          )}
        </div>

        {/* Campo Preço (Opcional) */}
        <div>
          <label htmlFor="item-price" className="block text-sm font-medium mb-1">
            Preço (opcional)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
              R$
            </span>
            <input
              id="item-price"
              type="text"
              {...register('price')}
              onChange={handlePriceChange}
              placeholder="0,00"
              className={`w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                errors.price
                  ? 'border-red-500 focus:ring-red-500'
                  : 'border-gray-300 focus:ring-blue-500'
              }`}
              disabled={isLoading}
            />
          </div>
          {errors.price && (
            <p className="mt-1 text-sm text-red-600">{errors.price.message}</p>
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
