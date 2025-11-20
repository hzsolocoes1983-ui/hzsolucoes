
import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Modal } from '../components/ui/modal';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { trpcFetch } from '../lib/trpc';
import { formatCurrency, parseBrazilianNumber, formatCurrencyInput, requireAuth } from '../lib/utils';
import { exportTransactionsToCSV } from '../lib/csvExport';

export default function TransactionsPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<any>(null);
  const [transactionType, setTransactionType] = useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [isFixed, setIsFixed] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const queryClient = useQueryClient();
  
  const user = requireAuth();

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth() + 1;

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
    mutationFn: async () => {
      const amountNum = parseBrazilianNumber(amount);
      if (!amountNum || amountNum <= 0) {
        throw new Error('Valor inválido');
      }
      
      const userId = typeof user.id === 'string' ? parseInt(user.id, 10) : user.id;
      
      await trpcFetch('addTransaction', {
        userId: userId,
        type: transactionType,
        amount: amountNum,
        description: description || undefined,
        isFixed: transactionType === 'expense' ? isFixed : false,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['summary'] });
      setShowAddModal(false);
      setAmount('');
      setDescription('');
      setIsFixed(false);
      alert('Transação adicionada com sucesso!');
    },
    onError: (error: any) => {
      alert('Erro: ' + error.message);
    }
  });

  const updateTransaction = useMutation({
    mutationFn: async () => {
      if (!editingTransaction) return;
      
      const amountNum = parseBrazilianNumber(amount);
      if (!amountNum || amountNum <= 0) {
        throw new Error('Valor inválido');
      }
      
      const userId = typeof user.id === 'string' ? parseInt(user.id, 10) : user.id;
      
      await trpcFetch('updateTransaction', {
        id: editingTransaction.id,
        userId: userId,
        type: transactionType,
        amount: amountNum,
        description: description || undefined,
        isFixed: transactionType === 'expense' ? isFixed : false,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['summary'] });
      setShowEditModal(false);
      setEditingTransaction(null);
      setAmount('');
      setDescription('');
      setIsFixed(false);
      alert('Transação atualizada com sucesso!');
    },
    onError: (error: any) => {
      alert('Erro: ' + error.message);
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
      alert('Transação excluída com sucesso!');
    },
    onError: (error: any) => {
      alert('Erro: ' + error.message);
    }
  });

  const handleEdit = (transaction: any) => {
    setEditingTransaction(transaction);
    setTransactionType(transaction.type);
    setAmount(formatCurrencyInput(transaction.amount.toString()));
    setDescription(transaction.description || '');
    setIsFixed(transaction.isFixed || false);
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

  // Filtrar transações por busca
  const filteredTransactions = transactions.filter(t => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (t.description?.toLowerCase().includes(term)) ||
      (t.category?.toLowerCase().includes(term)) ||
      (t.amount.toString().includes(term))
    );
  });

  const totalIncome = filteredTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const totalExpenses = filteredTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white shadow-sm p-4 sticky top-0 z-10">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-gray-800">Transações</h1>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => exportTransactionsToCSV(transactions)}
              disabled={transactions.length === 0}
            >
              📊 Exportar CSV
            </Button>
            <Button variant="outline" onClick={() => window.history.back()}>
              Voltar
            </Button>
          </div>
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

        {/* Campo de busca */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="🔍 Buscar por descrição, categoria ou valor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
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
          <Button size="sm" onClick={() => setShowAddModal(true)} className="ml-auto">
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
          <div className="text-center py-8 text-gray-500">Carregando...</div>
        ) : filteredTransactions.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-gray-500">
              Nenhuma transação encontrada para este período.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {filteredTransactions.map((transaction: any) => (
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
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
            <div className="flex gap-2">
              <Button
                variant={transactionType === 'income' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTransactionType('income')}
                className="flex-1"
              >
                Receita
              </Button>
              <Button
                variant={transactionType === 'expense' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTransactionType('expense')}
                className="flex-1"
              >
                Despesa
              </Button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Valor (R$)</label>
            <input
              type="text"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              onBlur={() => setAmount(formatCurrencyInput(amount))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0,00"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ex: Mercado, Salário..."
            />
          </div>
          {transactionType === 'expense' && (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isFixed"
                checked={isFixed}
                onChange={(e) => setIsFixed(e.target.checked)}
                className="w-4 h-4"
              />
              <label htmlFor="isFixed" className="text-sm text-gray-700">
                Despesa fixa mensal
              </label>
            </div>
          )}
          <div className="flex gap-2">
            <Button 
              onClick={() => addTransaction.mutate()} 
              disabled={addTransaction.isPending || !amount} 
              className="flex-1"
            >
              {addTransaction.isPending ? 'Salvando...' : 'Salvar'}
            </Button>
            <Button variant="outline" onClick={() => setShowAddModal(false)}>
              Cancelar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal Editar */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Editar Transação">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
            <div className="flex gap-2">
              <Button
                variant={transactionType === 'income' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTransactionType('income')}
                className="flex-1"
              >
                Receita
              </Button>
              <Button
                variant={transactionType === 'expense' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTransactionType('expense')}
                className="flex-1"
              >
                Despesa
              </Button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Valor (R$)</label>
            <input
              type="text"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              onBlur={() => setAmount(formatCurrencyInput(amount))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0,00"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ex: Mercado, Salário..."
            />
          </div>
          {transactionType === 'expense' && (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isFixedEdit"
                checked={isFixed}
                onChange={(e) => setIsFixed(e.target.checked)}
                className="w-4 h-4"
              />
              <label htmlFor="isFixedEdit" className="text-sm text-gray-700">
                Despesa fixa mensal
              </label>
            </div>
          )}
          <div className="flex gap-2">
            <Button 
              onClick={() => updateTransaction.mutate()} 
              disabled={updateTransaction.isPending || !amount} 
              className="flex-1"
            >
              {updateTransaction.isPending ? 'Salvando...' : 'Salvar'}
            </Button>
            <Button variant="outline" onClick={() => setShowEditModal(false)}>
              Cancelar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
