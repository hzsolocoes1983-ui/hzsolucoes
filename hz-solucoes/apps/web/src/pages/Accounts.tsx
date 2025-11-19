import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Modal } from '../components/ui/modal';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { trpcFetch } from '../lib/trpc';
import { formatCurrency, parseBrazilianNumber, formatCurrencyInput, requireAuth } from '../lib/utils';

export default function AccountsPage() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<any>(null);
  const [accountName, setAccountName] = useState('');
  const [accountType, setAccountType] = useState<'checking' | 'savings' | 'investment'>('checking');
  const [accountBalance, setAccountBalance] = useState('');
  const [accountIcon, setAccountIcon] = useState('🏦');
  
  const queryClient = useQueryClient();
  const user = requireAuth();

  const { data: accounts = [], isLoading } = useQuery({
    queryKey: ['accounts', user.id],
    queryFn: async () => {
      const userId = typeof user.id === 'string' ? parseInt(user.id, 10) : user.id;
      return await trpcFetch<any[]>('getAccounts', { userId: userId });
    },
  });

  const addAccount = useMutation({
    mutationFn: async () => {
      const userId = typeof user.id === 'string' ? parseInt(user.id, 10) : user.id;
      const balance = accountBalance ? parseBrazilianNumber(accountBalance) : 0;
      
      await trpcFetch('addAccount', {
        userId: userId,
        name: accountName,
        type: accountType,
        balance: balance,
        icon: accountIcon,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      setShowAddModal(false);
      setAccountName('');
      setAccountBalance('');
      setAccountIcon('🏦');
      alert('Conta adicionada com sucesso!');
    },
    onError: (error: any) => {
      alert('Erro: ' + error.message);
    }
  });

  const updateAccount = useMutation({
    mutationFn: async () => {
      if (!editingAccount) return;
      
      const userId = typeof user.id === 'string' ? parseInt(user.id, 10) : user.id;
      const balance = accountBalance ? parseBrazilianNumber(accountBalance) : undefined;
      
      await trpcFetch('updateAccount', {
        id: editingAccount.id,
        userId: userId,
        name: accountName || undefined,
        balance: balance,
        icon: accountIcon || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      setShowEditModal(false);
      setEditingAccount(null);
      setAccountName('');
      setAccountBalance('');
      setAccountIcon('🏦');
      alert('Conta atualizada com sucesso!');
    },
    onError: (error: any) => {
      alert('Erro: ' + error.message);
    }
  });

  const deleteAccount = useMutation({
    mutationFn: async (accountId: number) => {
      const userId = typeof user.id === 'string' ? parseInt(user.id, 10) : user.id;
      await trpcFetch('deleteAccount', {
        id: accountId,
        userId: userId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      alert('Conta excluída com sucesso!');
    },
    onError: (error: any) => {
      alert('Erro: ' + error.message);
    }
  });

  const handleEdit = (account: any) => {
    setEditingAccount(account);
    setAccountName(account.name);
    setAccountType(account.type);
    setAccountBalance(formatCurrencyInput(account.balance.toString()));
    setAccountIcon(account.icon || '🏦');
    setShowEditModal(true);
  };

  const handleDelete = (account: any) => {
    if (window.confirm(`Tem certeza que deseja excluir a conta "${account.name}"?`)) {
      deleteAccount.mutate(account.id);
    }
  };

  const totalBalance = accounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);

  const accountTypeLabels = {
    checking: 'Conta Corrente',
    savings: 'Poupança',
    investment: 'Investimento'
  };

  const iconOptions = ['🏦', '💳', '💰', '🏛️', '📊', '💵', '💴', '💶', '💷'];

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white shadow-sm p-4 sticky top-0 z-10">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-gray-800">Contas Bancárias</h1>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => setShowAddModal(true)}>
              + Adicionar
            </Button>
            <Button variant="outline" size="sm" onClick={() => window.history.back()}>
              Voltar
            </Button>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4 max-w-6xl mx-auto">
        {/* Saldo Total */}
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardContent className="p-6">
            <div className="text-sm mb-1 opacity-90">Saldo Total</div>
            <div className="text-3xl font-bold">
              {formatCurrency(totalBalance)}
            </div>
            <div className="text-xs mt-1 opacity-80">
              {accounts.length} conta{accounts.length !== 1 ? 's' : ''}
            </div>
          </CardContent>
        </Card>

        {/* Lista de Contas */}
        {isLoading ? (
          <div className="text-center py-8 text-gray-500">Carregando...</div>
        ) : accounts.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-gray-500">
              Nenhuma conta cadastrada ainda. Clique em "+ Adicionar" para começar.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {accounts.map((account: any) => (
              <Card key={account.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="text-3xl">{account.icon || '🏦'}</div>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-800 text-lg mb-1">
                          {account.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {accountTypeLabels[account.type as keyof typeof accountTypeLabels]}
                        </div>
                        <div className={`text-2xl font-bold mt-2 ${account.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(account.balance)}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleEdit(account)}
                        className="text-xs px-3"
                      >
                        Editar
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleDelete(account)}
                        className="text-xs px-3 text-red-600 hover:bg-red-50"
                      >
                        Excluir
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Modal Adicionar */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Adicionar Conta">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ícone</label>
            <div className="flex gap-2 flex-wrap">
              {iconOptions.map(icon => (
                <button
                  key={icon}
                  onClick={() => setAccountIcon(icon)}
                  className={`text-2xl p-2 rounded border-2 ${accountIcon === icon ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Conta</label>
            <input
              type="text"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ex: Itaú, Santander, Nubank..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
            <div className="flex gap-2">
              <Button
                variant={accountType === 'checking' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setAccountType('checking')}
                className="flex-1"
              >
                Corrente
              </Button>
              <Button
                variant={accountType === 'savings' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setAccountType('savings')}
                className="flex-1"
              >
                Poupança
              </Button>
              <Button
                variant={accountType === 'investment' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setAccountType('investment')}
                className="flex-1"
              >
                Investimento
              </Button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Saldo Inicial (R$)</label>
            <input
              type="text"
              value={accountBalance}
              onChange={(e) => setAccountBalance(e.target.value)}
              onBlur={() => setAccountBalance(formatCurrencyInput(accountBalance))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0,00"
            />
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={() => addAccount.mutate()} 
              disabled={addAccount.isPending || !accountName} 
              className="flex-1"
            >
              {addAccount.isPending ? 'Salvando...' : 'Adicionar'}
            </Button>
            <Button variant="outline" onClick={() => setShowAddModal(false)}>
              Cancelar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal Editar */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Editar Conta">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ícone</label>
            <div className="flex gap-2 flex-wrap">
              {iconOptions.map(icon => (
                <button
                  key={icon}
                  onClick={() => setAccountIcon(icon)}
                  className={`text-2xl p-2 rounded border-2 ${accountIcon === icon ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Conta</label>
            <input
              type="text"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ex: Itaú, Santander, Nubank..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Saldo Atual (R$)</label>
            <input
              type="text"
              value={accountBalance}
              onChange={(e) => setAccountBalance(e.target.value)}
              onBlur={() => setAccountBalance(formatCurrencyInput(accountBalance))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0,00"
            />
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={() => updateAccount.mutate()} 
              disabled={updateAccount.isPending || !accountName} 
              className="flex-1"
            >
              {updateAccount.isPending ? 'Salvando...' : 'Salvar'}
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
