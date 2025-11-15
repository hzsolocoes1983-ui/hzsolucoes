import React from 'react';
import { GoalCircle } from '../components/GoalCircle';
import { MonthlyReport } from '../components/MonthlyReport';
import { Card, CardHeader, CardTitle, CardContent } from '@ui/card';
import { Button } from '@ui/button';
import { useQuery } from '@tanstack/react-query';
import { trpc } from '../lib/trpc';

export default function Dashboard() {
  const user = JSON.parse(localStorage.getItem('user')!);
  const { data: goals = [] } = useQuery({ queryKey: ['goals'], queryFn: () => trpc.getGoals.query() });
  const { data: balance = 0 } = useQuery({
    queryKey: ['balance'],
    queryFn: async () => {
      const [rev, exp] = await Promise.all([
        trpc.getMonthlyTotal.query({ year: 2025, month: 11 }),
        trpc.getMonthlyExpensesTotal.query({ year: 2025, month: 11 })
      ]);
      return rev - exp;
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
          <p className={`text-3xl font-bold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            R$ {balance.toFixed(2)}
          </p>
        </CardContent>
      </Card>

      <div>
        <h2 className="text-xl font-semibold mb-4">Nossas Metas</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {goals.map((goal: any) => <GoalCircle key={goal.id} goal={goal} />)}
        </div>
      </div>

      <MonthlyReport />
    </div>
  );
}