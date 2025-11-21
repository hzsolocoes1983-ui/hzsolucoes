import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Modal } from '../components/ui/modal';
import { Input } from '../components/ui/input';
import { useToast } from '../components/ui/toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { trpcFetch } from '../lib/trpc';
import { formatCurrency, parseBrazilianNumber, requireAuth } from '../lib/utils';
import { useFormValidation, itemSchema } from '../hooks/useFormValidation';
import { useErrorHandler } from '../hooks/useErrorHandler';

export default function ItemsPage() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'bought'>('all');
  
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const handleError = useErrorHandler();
  const user = requireAuth();

  const { register, handleSubmit, formState: { errors }, reset } = useFormValidation(itemSchema);

  const { data: allItems = [], isLoading } = useQuery({
    queryKey: ['items', user.id],
    queryFn: async () => {
      const userId = typeof user.id === 'string' ? parseInt(user.id, 10) : user.id;
      return await trpcFetch<any[]>('getItems', { userId: userId });
    },
  });

  const items = filterStatus === 'all' 
    ? allItems 
    : allItems.filter((item: any) => item.status === filterStatus);

  const addItem = useMutation({
    mutationFn: async (data: any) => {
      const userId = typeof user.id === 'string' ? parseInt(user.id, 10) : user.id;
      const price = data.price ? parseBrazilianNumber(data.price) : undefined;
      
      await trpcFetch('addItem', {
        userId: userId,
        name: data.name,
        price,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      queryClient.invalidateQueries({ queryKey: ['pendingItems'] });
      setShowAddModal(false);
      reset();
      showToast('Item adicionado com sucesso!', 'success');
    },
    onError: (error: any) => {
      handleError(error, 'Erro ao adicionar item');
    }
  });

  const updateItemStatus = useMutation({
    mutationFn: async ({ id, status, userId }: { id: number; status: 'pending' | 'bought'; userId: number }) => {
      await trpcFetch('updateItemStatus', { id, status, userId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      queryClient.invalidateQueries({ queryKey: ['pendingItems'] });
      showToast('Status atualizado!', 'success');
    },
    onError: (error: any) => {
      handleError(error, 'Erro ao atualizar status');
    }
  });

  const deleteItem = useMutation({
    mutationFn: async (itemId: number) => {
      const userId = typeof user.id === 'string' ? parseInt(user.id, 10) : user.id;
      await trpcFetch('deleteItem', {
        id: itemId,
        userId: userId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      queryClient.invalidateQueries({ queryKey: ['pendingItems'] });
      showToast('Item excluído com sucesso!', 'success');
    },
    onError: (error: any) => {
      handleError(error, 'Erro ao excluir item');
    }
  });

  const handleToggleStatus = (item: any) => {
    const userId = typeof user.id === 'string' ? parseInt(user.id, 10) : user.id;
    const newStatus = item.status === 'pending' ? 'bought' : 'pending';
    updateItemStatus.mutate({ id: item.id, status: newStatus, userId });
  };

  const handleDelete = (item: any) => {
    if (window.confirm(`Tem certeza que deseja excluir "${item.name}"?`)) {
      deleteItem.mutate(item.id);
    }
  };

  const pendingItems = allItems.filter((item: any) => item.status === 'pending');
  const boughtItems = allItems.filter((item: any) => item.status === 'bought');
  const totalPending = pendingItems.reduce((sum: number, item: any) => sum + (item.price || 0), 0);

  const onSubmit = handleSubmit((data) => {
    addItem.mutate(data);
  });

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white shadow-sm p-4 sticky top-0 z-10">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-gray-800">Lista de Compras</h1>
          <div className="flex gap-2">
            <Button 
              size="sm" 
              onClick={() => {
                reset();
                setShowAddModal(true);
              }}
            >
              + Adicionar
            </Button>
            <Button variant="outline" size="sm" onClick={() => window.history.back()}>
              Voltar
            </Button>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant={filterStatus === 'all' ? 'default' : 'outline'} 
            size="sm" 
            onClick={() => setFilterStatus('all')}
          >
            Todas ({allItems.length})
          </Button>
          <Button 
            variant={filterStatus === 'pending' ? 'default' : 'outline'} 
            size="sm" 
            onClick={() => setFilterStatus('pending')}
          >
            Pendentes ({pendingItems.length})
          </Button>
          <Button 
            variant={filterStatus === 'bought' ? 'default' : 'outline'} 
            size="sm" 
            onClick={() => setFilterStatus('bought')}
          >
            Comprados ({boughtItems.length})
          </Button>
        </div>
      </div>

      <div className="p-4 space-y-4 max-w-6xl mx-auto">
        {/* Resumo */}
        {pendingItems.length > 0 && (
          <Card className="bg-yellow-50 border-yellow-200">
            <CardContent className="p-4">
              <div className="text-sm text-gray-600 mb-1">Total Pendente</div>
              <div className="text-xl font-bold text-gray-800">
                {formatCurrency(totalPending)}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {pendingItems.length} item{pendingItems.length !== 1 ? 's' : ''} pendente{pendingItems.length !== 1 ? 's' : ''}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Lista de Itens */}
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="animate-pulse flex items-center gap-3">
                    <div className="w-6 h-6 bg-gray-200 rounded-full"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : items.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-gray-500">
              <div className="text-6xl mb-4">🛒</div>
              <p className="text-lg mb-2">
                {filterStatus === 'all' 
                  ? 'Nenhum item na lista ainda' 
                  : filterStatus === 'pending'
                  ? 'Nenhum item pendente'
                  : 'Nenhum item comprado ainda'}
              </p>
              <p className="text-sm">
                {filterStatus === 'all' && 'Adicione itens para começar sua lista de compras!'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {items.map((item: any) => (
              <Card key={item.id} className={item.status === 'bought' ? 'opacity-60' : ''}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <div className="flex-1 flex items-center gap-3">
                      <button
                        onClick={() => handleToggleStatus(item)}
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                          item.status === 'bought'
                            ? 'bg-green-500 border-green-500 text-white'
                            : 'border-gray-300 hover:border-green-500'
                        }`}
                        disabled={updateItemStatus.isPending}
                      >
                        {item.status === 'bought' && '✓'}
                      </button>
                      <div className="flex-1">
                        <div className={`font-medium text-gray-800 ${item.status === 'bought' ? 'line-through' : ''}`}>
                          {item.name}
                        </div>
                        {item.price && (
                          <div className="text-sm text-gray-500">
                            {formatCurrency(item.price)}
                          </div>
                        )}
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => handleDelete(item)}
                      className="text-xs px-2 py-1 h-auto text-red-600 hover:bg-red-50"
                      disabled={deleteItem.isPending}
                    >
                      Excluir
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Modal Adicionar Item */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Adicionar Item">
        <form onSubmit={onSubmit} className="space-y-4">
          <Input
            label="Nome do Item"
            placeholder="Ex: Arroz 5kg"
            error={errors.name?.message}
            {...register('name')}
            required
          />

          <Input
            label="Preço (Opcional)"
            placeholder="0,00"
            error={errors.price?.message}
            {...register('price')}
            helperText="Deixe em branco se não souber o preço"
          />

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowAddModal(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={addItem.isPending}
            >
              {addItem.isPending ? 'Adicionando...' : 'Adicionar'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
