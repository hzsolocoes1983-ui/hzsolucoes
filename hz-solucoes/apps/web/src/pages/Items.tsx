import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Modal } from '../components/ui/modal';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { trpcFetch } from '../lib/trpc';
import { formatCurrency, parseBrazilianNumber, requireAuth } from '../lib/utils';
import { exportItemsToCSV } from '../lib/csvExport';

export default function ItemsPage() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'bought'>('all');
  const [itemName, setItemName] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  
  const queryClient = useQueryClient();
  
  const user = requireAuth();

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
    mutationFn: async () => {
      const userId = typeof user.id === 'string' ? parseInt(user.id, 10) : user.id;
      await trpcFetch('addItem', {
        userId: userId,
        name: itemName,
        price: itemPrice ? parseBrazilianNumber(itemPrice) : undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      queryClient.invalidateQueries({ queryKey: ['pendingItems'] });
      setShowAddModal(false);
      setItemName('');
      setItemPrice('');
      alert('Item adicionado com sucesso!');
    },
    onError: (error: any) => {
      alert('Erro: ' + error.message);
    }
  });

  const updateItemStatus = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: 'pending' | 'bought' }) => {
      await trpcFetch('updateItemStatus', { id, status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      queryClient.invalidateQueries({ queryKey: ['pendingItems'] });
    },
    onError: (error: any) => {
      alert('Erro: ' + error.message);
    }
  });


  const pendingItems = allItems.filter((item: any) => item.status === 'pending');
  const boughtItems = allItems.filter((item: any) => item.status === 'bought');
  const totalPending = pendingItems.reduce((sum: number, item: any) => sum + (item.price || 0), 0);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white shadow-sm p-4 sticky top-0 z-10">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-gray-800">Lista de Compras</h1>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => setShowAddModal(true)}>
              + Adicionar
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => exportItemsToCSV(allItems)}
              disabled={allItems.length === 0}
            >
              📊 Exportar
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
          <div className="text-center py-8 text-gray-500">Carregando...</div>
        ) : items.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-gray-500">
              {filterStatus === 'all' 
                ? 'Nenhum item na lista ainda.' 
                : filterStatus === 'pending'
                ? 'Nenhum item pendente.'
                : 'Nenhum item comprado ainda.'}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {items.map((item: any) => (
              <Card key={item.id} className={item.status === 'bought' ? 'opacity-60' : ''}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-lg ${item.status === 'bought' ? 'text-green-600' : 'text-yellow-600'}`}>
                          {item.status === 'bought' ? '✓' : '○'}
                        </span>
                        <div className={`font-medium ${item.status === 'bought' ? 'line-through text-gray-500' : 'text-gray-800'}`}>
                          {item.name}
                        </div>
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(item.createdAt).toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {item.price && (
                        <div className="text-lg font-semibold text-gray-800">
                          {formatCurrency(item.price)}
                        </div>
                      )}
                      <Button
                        size="sm"
                        variant={item.status === 'pending' ? 'default' : 'outline'}
                        onClick={() => {
                          updateItemStatus.mutate({
                            id: item.id,
                            status: item.status === 'pending' ? 'bought' : 'pending'
                          });
                        }}
                        disabled={updateItemStatus.isPending}
                      >
                        {item.status === 'pending' ? 'Marcar Comprado' : 'Desmarcar'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Modal Adicionar Item */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Adicionar Item">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Item</label>
            <input
              type="text"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ex: Leite, Pão..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Preço (R$) - Opcional</label>
            <input
              type="text"
              value={itemPrice}
              onChange={(e) => setItemPrice(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0,00"
            />
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={() => addItem.mutate()} 
              disabled={addItem.isPending || !itemName} 
              className="flex-1"
            >
              {addItem.isPending ? 'Salvando...' : 'Adicionar'}
            </Button>
            <Button variant="outline" onClick={() => setShowAddModal(false)}>
              Cancelar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

