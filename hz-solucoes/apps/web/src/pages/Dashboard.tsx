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
  
  // Dados mockados temporariamente até corrigir tRPC
  const goals = [
    { id: 1, name: 'Reserva', targetAmount: 100000, currentAmount: 35000 },
    { id: 2, name: 'Viagem', targetAmount: 50000, currentAmount: 22000 },
    { id: 3, name: 'Reforma', targetAmount: 80000, currentAmount: 12000 },
  ];
  
  const balance = 3300; // Mock temporário

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