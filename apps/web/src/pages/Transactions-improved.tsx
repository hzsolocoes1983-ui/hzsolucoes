import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Modal } from '../components/ui/modal';
import { Input } from '../components/ui/input';
import { useToast } from '../components/ui/toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { trpcFetch } from '../lib/trpc';
import { formatCurrency, parseBrazilianNumber, formatCurrencyInput, requireAuth } from '../lib/utils';
import { useFormValidation, transactionSchema } from '../hooks/useFormValidation';
import { useErrorHandler } from '../hooks/useErrorHandler';

export default function TransactionsPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<any>(null);
  const [transactionType, setTransactionType] = useState<'income' | 'expense'>('expense');
  
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const handleError = useErrorHandler();
  const user = requireAuth();

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth() + 1;

  // Form validation
  const { register, handleSubmit, formState: { errors }, reset, setValue } = useFormValidation(transactionSchema);

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ['transactions', user.id, year, month, filterType],
    queryFn: async () => {
      const userId = typeof user.id === 'string' ? parseInt(user.id, 10) : user.id;
      const params: any = {
        userId: userId,
        year,
        month,
      };
      if (filterType !== 'all') {
        params.type = filterType;
      }
      return await trpcFetch<any[]>('getTransactions', params);
    },
  });

  const addTransaction = useMutation({
    mutationFn: async (data: any) => {
      const amountNum = parseBrazilianNumber(data.amount);
      const userId = typeof user.id === 'string' ? parseInt(user.id, 10) : user.id;
      
      await trpcFetch('addTransaction', {
        userId: userId,
        type: transactionType,
        amount: amountNum,
        description: data.description || undefined,
        isFixed: data.isFixed || false,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['summary'] });
      setShowAddModal(false);
      reset();
      showToast('Transação adicionada com sucesso!', 'success');
    },
    onError: (error: any) => {
      handleError(error, 'Erro ao adicionar transação');
    }
  });

  const updateTransaction = useMutation({
    mutationFn: async (data: any) => {
      if (!editingTransaction) return;
      
      const amountNum = parseBrazilianNumber(data.amount);
      const userId = typeof user.id === 'string' ? parseInt(user.id, 10) : user.id;
      
      await trpcFetch('updateTransaction', {
        id: editingTransaction.id,
        userId: userId,
        type: transactionType,
        amount: amountNum,
        description: data.description || undefined,
        isFixed: data.isFixed || false,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['summary'] });
      setShowEditModal(false);
      setEditingTransaction(null);
      reset();
      showToast('Transação atualizada com sucesso!', 'success');
    },
    onError: (error: any) => {
      handleError(error, 'Erro ao atualizar transação');
    }
  });

  const deleteTransaction = useMutation({
    mutationFn: async (transactionId: number) => {
      const userId = typeof user.id === 'string' ? parseInt(user.id, 10) : user.id;
      await trpcFetch('deleteTransaction', {
        id: transactionId,
        userId: userId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['summary'] });
      showToast('Transação excluída com sucesso!', 'success');
    },
    onError: (error: any) => {
      handleError(error, 'Erro ao excluir transação');
    }
  });

  const handleEdit = (transaction: any) => {
    setEditingTransaction(transaction);
    setTransactionType(transaction.type);
    setValue('amount', formatCurrencyInput(transaction.amount.toString()));
    setValue('description', transaction.description || '');
    setValue('isFixed', transaction.isFixed || false);
    setShowEditModal(true);
  };

  const handleDelete = (transaction: any) => {
    if (window.confirm(`Tem certeza que deseja excluir a transação "${transaction.description || 'Sem descrição'}"?`)) {
      deleteTransaction.mutate(transaction.id);
    }
  };

  const changeMonth = (direction: 'prev' | 'next' | 'current') => {
    const newDate = new Date(currentMonth);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else if (direction === 'next') {
      newDate.setMonth(newDate.getMonth() + 1);
    } else {
      setCurrentMonth(new Date());
      return;
    }
    setCurrentMonth(newDate);
  };

  const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const totalExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const onSubmitAdd = handleSubmit((data) => {
    addTransaction.mutate(data);
  });

  const onSubmitEdit = handleSubmit((data) => {
    updateTransaction.mutate(data);
  });

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white shadow-sm p-4 sticky top-0 z-10">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-gray-800">Transações</h1>
          <Button variant="outline" onClick={() => window.history.back()}>
            Voltar
          </Button>
        </div>
        
        <div className="flex gap-2 mb-4">
          <Button 
            variant={filterType === 'all' ? 'default' : 'outline'} 
            size="sm" 
            onClick={() => setFilterType('all')}
          >
            Todas
          </Button>
          <Button 
            variant={filterType === 'income' ? 'default' : 'outline'} 
            size="sm" 
            onClick={() => setFilterType('income')}
          >
            Receitas
          </Button>
          <Button 
            variant={filterType === 'expense' ? 'default' : 'outline'} 
            size="sm" 
            onClick={() => setFilterType('expense')}
          >
            Despesas
          </Button>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => changeMonth('prev')}>
            ←
          </Button>
          <Button variant="outline" size="sm" onClick={() => changeMonth('current')}>
            {monthNames[month - 1]} {year}
          </Button>
          <Button variant="outline" size="sm" onClick={() => changeMonth('next')}>
            →
          </Button>
          <Button 
            size="sm" 
            onClick={() => {
              reset();
              setShowAddModal(true);
            }} 
            className="ml-auto"
          >
            + Adicionar
          </Button>
        </div>
      </div>

      <div className="p-4 space-y-4 max-w-6xl mx-auto">
        {/* Resumo */}
        <div className="grid grid-cols-2 gap-3">
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-gray-600 mb-1">Total Receitas</div>
              <div className="text-xl font-bold text-green-600">
                {formatCurrency(totalIncome)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-gray-600 mb-1">Total Despesas</div>
              <div className="text-xl font-bold text-red-600">
                {formatCurrency(totalExpenses)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lista de Transações */}
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : transactions.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-gray-500">
              Nenhuma transação encontrada para este período.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {transactions.map((transaction: any) => (
              <Card key={transaction.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-lg ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                          {transaction.type === 'income' ? '↑' : '↓'}
                        </span>
                        <div className="font-medium text-gray-800">
                          {transaction.description || 'Sem descrição'}
                        </div>
                        {transaction.isFixed && (
                          <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">
                            Fixa
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(transaction.date).toLocaleDateString('pt-BR')}
                        {transaction.category && ` • ${transaction.category}`}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <div className={`text-lg font-bold ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                        {transaction.type === 'income' ? '+' : '-'}
                        {formatCurrency(transaction.amount)}
                      </div>
                      <div className="flex gap-1">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleEdit(transaction)}
                          className="text-xs px-2 py-1 h-auto"
                        >
                          Editar
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleDelete(transaction)}
                          className="text-xs px-2 py-1 h-auto text-red-600 hover:bg-red-50"
                        >
                          Excluir
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Modal Adicionar */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Adicionar Transação">
        <form onSubmit={onSubmitAdd} className="space-y-4">
          <div className="flex gap-2">
            <Button
              type="button"
              variant={transactionType === 'expense' ? 'default' : 'outline'}
              onClick={() => setTransactionType('expense')}
              className="flex-1"
            >
              Despesa
            </Button>
            <Button
              type="button"
              variant={transactionType === 'income' ? 'default' : 'outline'}
              onClick={() => setTransactionType('income')}
              className="flex-1"
            >
              Receita
            </Button>
          </div>

          <Input
            label="Valor"
            placeholder="0,00"
            error={errors.amount?.message}
            {...register('amount')}
            required
          />

          <Input
            label="Descrição"
            placeholder="Ex: Compras do mês"
            error={errors.description?.message}
            {...register('description')}
          />

          {transactionType === 'expense' && (
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                {...register('isFixed')}
                className="rounded"
              />
              <span className="text-sm text-gray-700">Despesa fixa mensal</span>
            </label>
          )}

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
              disabled={addTransaction.isPending}
            >
              {addTransaction.isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Editar */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Editar Transação">
        <form onSubmit={onSubmitEdit} className="space-y-4">
          <div className="flex gap-2">
            <Button
              type="button"
              variant={transactionType === 'expense' ? 'default' : 'outline'}
              onClick={() => setTransactionType('expense')}
              className="flex-1"
            >
              Despesa
            </Button>
            <Button
              type="button"
              variant={transactionType === 'income' ? 'default' : 'outline'}
              onClick={() => setTransactionType('income')}
              className="flex-1"
            >
              Receita
            </Button>
          </div>

          <Input
            label="Valor"
            placeholder="0,00"
            error={errors.amount?.message}
            {...register('amount')}
            required
          />

          <Input
            label="Descrição"
            placeholder="Ex: Compras do mês"
            error={errors.description?.message}
            {...register('description')}
          />

          {transactionType === 'expense' && (
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                {...register('isFixed')}
                className="rounded"
              />
              <span className="text-sm text-gray-700">Despesa fixa mensal</span>
            </label>
          )}

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowEditModal(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={updateTransaction.isPending}
            >
              {updateTransaction.isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
