import React from 'react';
import { GoalCircle } from '../components/GoalCircle';
import { MonthlyReport } from '../components/MonthlyReport';
import { Card, CardHeader, CardTitle, CardContent } from '@ui/card';
import { Button } from '@ui/button';
import { useQuery } from '@tanstack/react-query';
import { trpc } from '../lib/trpc';

export default function Dashboard() {
  const userStr = localStorage.getItem('user');
  if (!userStr) {
    window.location.href = '/';
    return null;
  }
  
  const user = JSON.parse(userStr);
  const trpcUrl = import.meta.env.VITE_TRPC_URL || '/trpc';
  
  // Buscar dados do backend
  const { data: goals = [], isLoading: goalsLoading } = useQuery({
    queryKey: ['goals'],
    queryFn: async () => {
      try {
        const response = await fetch(`${trpcUrl}/getGoals`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({})
        });
        if (!response.ok) throw new Error('Erro ao buscar metas');
        const result = await response.json();
        return result[0]?.result?.data?.json || [
          { id: 1, name: 'Reserva', targetAmount: 100000, currentAmount: 35000 },
          { id: 2, name: 'Viagem', targetAmount: 50000, currentAmount: 22000 },
          { id: 3, name: 'Reforma', targetAmount: 80000, currentAmount: 12000 },
        ];
      } catch (error) {
        console.error('Erro ao buscar metas:', error);
        // Fallback para dados mock
        return [
          { id: 1, name: 'Reserva', targetAmount: 100000, currentAmount: 35000 },
          { id: 2, name: 'Viagem', targetAmount: 50000, currentAmount: 22000 },
          { id: 3, name: 'Reforma', targetAmount: 80000, currentAmount: 12000 },
        ];
      }
    }
  });

  const { data: balance = 0, isLoading: balanceLoading } = useQuery({
    queryKey: ['balance'],
    queryFn: async () => {
      try {
        const now = new Date();
        const [rev, exp] = await Promise.all([
          fetch(`${trpcUrl}/getMonthlyTotal`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ year: now.getFullYear(), month: now.getMonth() + 1 })
          }).then(r => r.json()).then(r => r[0]?.result?.data?.json || 6500),
          fetch(`${trpcUrl}/getMonthlyExpensesTotal`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ year: now.getFullYear(), month: now.getMonth() + 1 })
          }).then(r => r.json()).then(r => r[0]?.result?.data?.json || 3200)
        ]);
        return rev - exp;
      } catch (error) {
        console.error('Erro ao calcular saldo:', error);
        return 3300; // Fallback
      }
    }
  });

  return (
    <div className="p-4 max-w-6xl mx-auto space-y-6">
      <header className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">HZ • {user.name}</h1>
        <Button variant="outline" onClick={() => { localStorage.clear(); location.reload(); }}>
          Sair
        </Button>
      </header>

      <Card className={`border-2 ${balance >= 0 ? 'border-green-500' : 'border-red-500'}`}>
        <CardHeader><CardTitle>Saldo do Mês</CardTitle></CardHeader>
        <CardContent>
          {balanceLoading ? (
            <p className="text-gray-500">Calculando...</p>
          ) : (
            <p className={`text-3xl font-bold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              R$ {balance.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          )}
        </CardContent>
      </Card>

      <div>
        <h2 className="text-xl font-semibold mb-4">Nossas Metas</h2>
        {goalsLoading ? (
          <p className="text-gray-500">Carregando metas...</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {goals.map((goal: any) => <GoalCircle key={goal.id} goal={goal} />)}
          </div>
        )}
      </div>

      <MonthlyReport />
    </div>
  );
}