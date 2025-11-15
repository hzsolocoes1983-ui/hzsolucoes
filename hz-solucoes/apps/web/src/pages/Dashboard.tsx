import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Modal } from '../components/ui/modal';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export default function Dashboard() {
  const userStr = localStorage.getItem('user');
  if (!userStr) {
    window.location.href = '/';
    return null;
  }
  
  const user = JSON.parse(userStr);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const trpcUrl = import.meta.env.VITE_TRPC_URL || '/trpc';
  const queryClient = useQueryClient();

  // Estados dos modais
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showIncomeModal, setShowIncomeModal] = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseDesc, setExpenseDesc] = useState('');
  const [incomeAmount, setIncomeAmount] = useState('');
  const [incomeDesc, setIncomeDesc] = useState('');
  const [itemName, setItemName] = useState('');
  const [itemPrice, setItemPrice] = useState('');

  const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

  const { data: summary = { revenue: 0, expenses: 0, fixed: 0, balance: 0 }, isLoading } = useQuery({
    queryKey: ['summary', currentMonth.getFullYear(), currentMonth.getMonth()],
    queryFn: async () => {
      try {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth() + 1;
        
        const [revenue, expenses] = await Promise.all([
          fetch(`${trpcUrl}/getMonthlyTotal`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ year, month })
          }).then(r => r.json()).then(r => r[0]?.result?.data?.json || 0),
          fetch(`${trpcUrl}/getMonthlyExpensesTotal`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ year, month })
          }).then(r => r.json()).then(r => r[0]?.result?.data?.json || 0)
        ]);

        return {
          revenue,
          expenses,
          fixed: 0, // TODO: adicionar endpoint para despesas fixas
          balance: revenue - expenses
        };
      } catch (error) {
        console.error('Erro ao buscar resumo:', error);
        return { revenue: 0, expenses: 0, fixed: 0, balance: 0 };
      }
    }
  });

  const formatCurrency = (value: number) => 
    value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  // Mutations
  const addExpense = useMutation({
    mutationFn: async () => {
      const response = await fetch(`${trpcUrl}/addTransaction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          "0": {
            "json": {
              userId: user.id,
              type: 'expense',
              amount: parseFloat(expenseAmount),
              description: expenseDesc,
            }
          }
        })
      });
      if (!response.ok) throw new Error('Erro ao adicionar despesa');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['summary'] });
      setShowExpenseModal(false);
      setExpenseAmount('');
      setExpenseDesc('');
      alert('Despesa adicionada com sucesso!');
    },
    onError: (error: any) => {
      alert('Erro: ' + error.message);
    }
  });

  const addIncome = useMutation({
    mutationFn: async () => {
      const response = await fetch(`${trpcUrl}/addTransaction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          "0": {
            "json": {
              userId: user.id,
              type: 'income',
              amount: parseFloat(incomeAmount),
              description: incomeDesc,
            }
          }
        })
      });
      if (!response.ok) throw new Error('Erro ao adicionar receita');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['summary'] });
      setShowIncomeModal(false);
      setIncomeAmount('');
      setIncomeDesc('');
      alert('Receita adicionada com sucesso!');
    },
    onError: (error: any) => {
      alert('Erro: ' + error.message);
    }
  });

  const addItem = useMutation({
    mutationFn: async () => {
      const response = await fetch(`${trpcUrl}/addItem`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          "0": {
            "json": {
              userId: user.id,
              name: itemName,
              price: itemPrice ? parseFloat(itemPrice) : undefined,
            }
          }
        })
      });
      if (!response.ok) throw new Error('Erro ao adicionar item');
      return response.json();
    },
    onSuccess: () => {
      setShowItemModal(false);
      setItemName('');
      setItemPrice('');
      alert('Item adicionado com sucesso!');
    },
    onError: (error: any) => {
      alert('Erro: ' + error.message);
    }
  });

  const addWater = useMutation({
    mutationFn: async () => {
      const response = await fetch(`${trpcUrl}/addWaterIntake`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          "0": {
            "json": {
              userId: user.id,
              amount: 200,
            }
          }
        })
      });
      if (!response.ok) throw new Error('Erro ao registrar água');
      return response.json();
    },
    onSuccess: () => {
      alert('200ml de água adicionado!');
    }
  });

  const markCare = useMutation({
    mutationFn: async (type: string) => {
      const response = await fetch(`${trpcUrl}/markDailyCare`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          "0": {
            "json": {
              userId: user.id,
              type,
              scheduledTime: '07:00',
            }
          }
        })
      });
      if (!response.ok) throw new Error('Erro ao marcar');
      return response.json();
    },
    onSuccess: () => {
      alert('Marcado com sucesso!');
    }
  });

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

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white shadow-sm p-4">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Dashboard Financeiro</h1>
            <p className="text-sm text-gray-600">Bem-vindo, {user.name || 'Usuário'}!</p>
          </div>
          <Button variant="outline" onClick={() => { localStorage.clear(); location.reload(); }}>
            Sair
          </Button>
        </div>
        
        {/* Navegação de mês */}
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => changeMonth('prev')}>
            Mês anterior
          </Button>
          <Button variant="outline" size="sm" onClick={() => changeMonth('current')}>
            Atual
          </Button>
          <Button variant="outline" size="sm" onClick={() => changeMonth('next')}>
            Próximo
          </Button>
          <Button variant="outline" size="sm">
            Exportar
          </Button>
        </div>
      </div>

      <div className="p-4 space-y-6 max-w-6xl mx-auto">
        {/* Cuidados do Dia */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <div>
              <h2 className="text-lg font-semibold text-gray-700">Cuidados do Dia</h2>
              <p className="text-xs text-gray-500">Rotinas pessoais saúde e bem-estar</p>
            </div>
            <div className="text-sm text-gray-600">
              {new Date().toLocaleDateString('pt-BR')}
            </div>
          </div>
          <div className="flex gap-2 mb-3">
            <Button variant="outline" size="sm">Ver calendário</Button>
            <Button variant="outline" size="sm">Configurar rotina</Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-3">
                <div className="text-center">
                  <div className="text-2xl mb-2">💊</div>
                  <div className="text-xs font-medium mb-1">Hormônios</div>
                  <div className="text-xs text-gray-600 mb-1">Horário 07:00</div>
                  <span className="inline-block bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded mb-2">Pendente</span>
                  <Button size="sm" className="w-full text-xs" onClick={() => markCare.mutate('hormones')} disabled={markCare.isPending}>
                    {markCare.isPending ? '...' : 'Marcar'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-3">
                <div className="text-center">
                  <div className="text-2xl mb-2">💊</div>
                  <div className="text-xs font-medium mb-1">Remédio</div>
                  <div className="text-xs text-gray-600 mb-1">Horário 08:00</div>
                  <span className="inline-block bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded mb-2">Pendente</span>
                  <Button size="sm" className="w-full text-xs" onClick={() => markCare.mutate('hormones')} disabled={markCare.isPending}>
                    {markCare.isPending ? '...' : 'Marcar'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-3">
                <div className="text-center">
                  <div className="text-2xl mb-2">🍴</div>
                  <div className="text-xs font-medium mb-1">Alimentação</div>
                  <div className="text-xs text-gray-600 mb-1">Próxima: Café às 08:30</div>
                  <Button size="sm" className="w-full text-xs mt-2" onClick={() => markCare.mutate('food')} disabled={markCare.isPending}>
                    {markCare.isPending ? '...' : 'Marcar próxima'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-cyan-50 border-cyan-200">
              <CardContent className="p-3">
                <div className="text-center">
                  <div className="text-2xl mb-2">💧</div>
                  <div className="text-xs font-medium mb-1">Água</div>
                  <div className="text-xs text-gray-600 mb-1">Meta 2000ml</div>
                  <div className="text-xs font-semibold mb-2">0ml / 2000ml</div>
                  <Button size="sm" className="w-full text-xs" onClick={() => addWater.mutate()} disabled={addWater.isPending}>
                    {addWater.isPending ? '...' : '+200ml'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-purple-50 border-purple-200">
              <CardContent className="p-3">
                <div className="text-center">
                  <div className="text-2xl mb-2">🏋️</div>
                  <div className="text-xs font-medium mb-1">Exercício</div>
                  <div className="text-xs text-gray-600 mb-1">Horário 11:10</div>
                  <Button size="sm" className="w-full text-xs mt-2">Marcar</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Resumo */}
        <div>
          <h2 className="text-lg font-semibold mb-3 text-gray-700">Visão rápida dos principais números</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-green-100 rounded flex items-center justify-center">
                    <span className="text-green-600 text-lg">↑</span>
                  </div>
                  <div className="text-xs text-gray-600">Receita do mês</div>
                </div>
                <div className="text-xl font-bold text-gray-800">
                  {isLoading ? '...' : formatCurrency(summary.revenue)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-pink-100 rounded flex items-center justify-center">
                    <span className="text-pink-600 text-lg">~</span>
                  </div>
                  <div className="text-xs text-gray-600">Gastos variáveis</div>
                </div>
                <div className="text-xl font-bold text-gray-800">
                  {isLoading ? '...' : formatCurrency(summary.expenses)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-yellow-100 rounded flex items-center justify-center">
                    <span className="text-yellow-600 text-lg">~</span>
                  </div>
                  <div className="text-xs text-gray-600">Mensais</div>
                </div>
                <div className="text-xl font-bold text-gray-800">
                  {isLoading ? '...' : formatCurrency(summary.fixed)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                    <span className="text-blue-600 text-lg">■</span>
                  </div>
                  <div className="text-xs text-gray-600">Saldo</div>
                </div>
                <div className={`text-xl font-bold ${summary.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {isLoading ? '...' : formatCurrency(summary.balance)}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Ações Rápidas */}
        <div>
          <h2 className="text-lg font-semibold mb-3 text-gray-700">Atalhos para suas rotinas diárias</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card className="cursor-pointer hover:shadow-md transition" onClick={() => setShowExpenseModal(true)}>
              <CardContent className="p-4 text-center">
                <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-pink-600 text-2xl">↓</span>
                </div>
                <div className="text-sm font-medium text-gray-700">Registrar gasto</div>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition" onClick={() => setShowIncomeModal(true)}>
              <CardContent className="p-4 text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-green-600 text-2xl">↑</span>
                </div>
                <div className="text-sm font-medium text-gray-700">Adicionar receita</div>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition">
              <CardContent className="p-4 text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-blue-600 text-xl">🔔</span>
                </div>
                <div className="text-sm font-medium text-gray-700">WhatsApp diário</div>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition" onClick={() => setShowItemModal(true)}>
              <CardContent className="p-4 text-center">
                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-yellow-600 text-xl">📋</span>
                </div>
                <div className="text-sm font-medium text-gray-700">Pendentes e comprados</div>
                <div className="text-xs text-gray-500 mt-1">0</div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Atividades Recentes */}
        <div>
          <h2 className="text-lg font-semibold mb-3 text-gray-700">Atividades Recentes</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Últimas Despesas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-gray-500">Nenhuma despesa</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Itens Pendentes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-gray-500">Nenhum item</div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Mais */}
        <div>
          <h2 className="text-lg font-semibold mb-3 text-gray-700">Explore por abas: Finanças, Despesas e Receitas</h2>
          <div className="flex gap-2">
            <Button variant="default">Finanças</Button>
            <Button variant="outline">Despesas</Button>
            <Button variant="outline">Receitas</Button>
          </div>
        </div>
      </div>

      {/* Navegação Inferior */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2">
        <div className="flex justify-around items-center max-w-md mx-auto">
          <button className="flex flex-col items-center gap-1 text-gray-600">
            <span className="text-xl">🏠</span>
            <span className="text-xs">Início</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-gray-600">
            <span className="text-xl">~</span>
            <span className="text-xs">Despesa</span>
          </button>
          <button className="w-14 h-14 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-lg">
            <span className="text-2xl">+</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-gray-600">
            <span className="text-xl">📊</span>
            <span className="text-xs">Relatórios</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-gray-600">
            <span className="text-xl">📋</span>
            <span className="text-xs">Itens</span>
          </button>
        </div>
      </div>

      {/* Modais */}
      <Modal isOpen={showExpenseModal} onClose={() => setShowExpenseModal(false)} title="Registrar Despesa">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Valor (R$)</label>
            <input
              type="number"
              step="0.01"
              value={expenseAmount}
              onChange={(e) => setExpenseAmount(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
            <input
              type="text"
              value={expenseDesc}
              onChange={(e) => setExpenseDesc(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ex: Mercado, Farmácia..."
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={() => addExpense.mutate()} disabled={addExpense.isPending || !expenseAmount} className="flex-1">
              {addExpense.isPending ? 'Salvando...' : 'Salvar'}
            </Button>
            <Button variant="outline" onClick={() => setShowExpenseModal(false)}>Cancelar</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showIncomeModal} onClose={() => setShowIncomeModal(false)} title="Adicionar Receita">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Valor (R$)</label>
            <input
              type="number"
              step="0.01"
              value={incomeAmount}
              onChange={(e) => setIncomeAmount(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
            <input
              type="text"
              value={incomeDesc}
              onChange={(e) => setIncomeDesc(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ex: Salário, Freelance..."
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={() => addIncome.mutate()} disabled={addIncome.isPending || !incomeAmount} className="flex-1">
              {addIncome.isPending ? 'Salvando...' : 'Salvar'}
            </Button>
            <Button variant="outline" onClick={() => setShowIncomeModal(false)}>Cancelar</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showItemModal} onClose={() => setShowItemModal(false)} title="Adicionar Item">
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
              type="number"
              step="0.01"
              value={itemPrice}
              onChange={(e) => setItemPrice(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0.00"
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={() => addItem.mutate()} disabled={addItem.isPending || !itemName} className="flex-1">
              {addItem.isPending ? 'Salvando...' : 'Salvar'}
            </Button>
            <Button variant="outline" onClick={() => setShowItemModal(false)}>Cancelar</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
