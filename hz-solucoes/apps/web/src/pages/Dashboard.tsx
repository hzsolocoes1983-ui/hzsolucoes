import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { useQuery } from '@tanstack/react-query';

export default function Dashboard() {
  const userStr = localStorage.getItem('user');
  if (!userStr) {
    window.location.href = '/';
    return null;
  }
  
  const user = JSON.parse(userStr);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const trpcUrl = import.meta.env.VITE_TRPC_URL || '/trpc';

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
            <Card className="cursor-pointer hover:shadow-md transition">
              <CardContent className="p-4 text-center">
                <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-pink-600 text-2xl">↓</span>
                </div>
                <div className="text-sm font-medium text-gray-700">Registrar gasto</div>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition">
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

            <Card className="cursor-pointer hover:shadow-md transition">
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
    </div>
  );
}
