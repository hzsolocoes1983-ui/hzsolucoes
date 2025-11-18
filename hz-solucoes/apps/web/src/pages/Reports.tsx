import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { trpcFetch } from '../lib/trpc';
import { formatCurrency, requireAuth } from '../lib/utils';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function ReportsPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  const user = requireAuth();

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth() + 1;

  const { data: expensesByCategory = [], isLoading: loadingCategory } = useQuery({
    queryKey: ['expensesByCategory', user.id, year, month],
    queryFn: async () => {
      return await trpcFetch<any[]>('getExpensesByCategory', { year, month, userId: user.id });
    },
  });

  const { data: expensesByUser = [], isLoading: loadingUser } = useQuery({
    queryKey: ['expensesByUser', year, month],
    queryFn: async () => {
      return await trpcFetch<any[]>('getExpensesByUser', { year, month });
    },
  });

  const { data: transactions = [], isLoading: loadingTransactions } = useQuery({
    queryKey: ['transactions', user.id, year, month],
    queryFn: async () => {
      return await trpcFetch<any[]>('getTransactions', {
        userId: user.id,
        year,
        month,
      });
    },
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

  const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

  // Preparar dados para gráficos
  const categoryData = expensesByCategory.map((item: any) => ({
    name: item.category || 'Sem categoria',
    value: Number(item.total || 0),
  }));

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  // Agrupar transações por dia
  const dailyData = transactions
    .filter((t: any) => t.type === 'expense')
    .reduce((acc: any, t: any) => {
      const date = new Date(t.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      if (!acc[date]) {
        acc[date] = 0;
      }
      acc[date] += t.amount;
      return acc;
    }, {});

  const dailyChartData = Object.entries(dailyData)
    .map(([date, value]) => ({ date, value: Number(value) }))
    .sort((a, b) => {
      const [dayA, monthA] = a.date.split('/');
      const [dayB, monthB] = b.date.split('/');
      return new Date(year, parseInt(monthA) - 1, parseInt(dayA)).getTime() - 
             new Date(year, parseInt(monthB) - 1, parseInt(dayB)).getTime();
    });

  const totalExpenses = expensesByCategory.reduce((sum: number, item: any) => sum + Number(item.total || 0), 0);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white shadow-sm p-4 sticky top-0 z-10">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-gray-800">Relatórios</h1>
          <Button variant="outline" onClick={() => window.history.back()}>
            Voltar
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
        </div>
      </div>

      <div className="p-4 space-y-6 max-w-6xl mx-auto">
        {/* Resumo */}
        <Card>
          <CardHeader>
            <CardTitle>Resumo do Mês</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-800">
              Total de Despesas: {formatCurrency(totalExpenses)}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              {transactions.filter((t: any) => t.type === 'expense').length} despesas registradas
            </div>
          </CardContent>
        </Card>

        {/* Gráfico por Categoria */}
        {loadingCategory ? (
          <Card>
            <CardContent className="p-8 text-center text-gray-500">Carregando...</CardContent>
          </Card>
        ) : categoryData.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Despesas por Categoria</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-4 space-y-2">
                {expensesByCategory.map((item: any, index: number) => (
                  <div key={index} className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="text-sm text-gray-700">{item.category || 'Sem categoria'}</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-800">
                      {formatCurrency(Number(item.total || 0))}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-8 text-center text-gray-500">
              Nenhuma despesa registrada para este período.
            </CardContent>
          </Card>
        )}

        {/* Gráfico por Dia */}
        {loadingTransactions ? (
          <Card>
            <CardContent className="p-8 text-center text-gray-500">Carregando...</CardContent>
          </Card>
        ) : dailyChartData.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Despesas por Dia</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dailyChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend />
                  <Bar dataKey="value" fill="#8884d8" name="Despesas (R$)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        ) : null}

        {/* Tabela Detalhada por Categoria */}
        {expensesByCategory.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Detalhamento por Categoria</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-4 text-sm font-semibold text-gray-700">Categoria</th>
                      <th className="text-right py-2 px-4 text-sm font-semibold text-gray-700">Total</th>
                      <th className="text-right py-2 px-4 text-sm font-semibold text-gray-700">% do Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expensesByCategory.map((item: any, index: number) => {
                      const percentage = totalExpenses > 0 
                        ? ((Number(item.total || 0) / totalExpenses) * 100).toFixed(1)
                        : '0.0';
                      return (
                        <tr key={index} className="border-b">
                          <td className="py-2 px-4 text-sm text-gray-800">{item.category || 'Sem categoria'}</td>
                          <td className="py-2 px-4 text-sm font-semibold text-right text-gray-800">
                            {formatCurrency(Number(item.total || 0))}
                          </td>
                          <td className="py-2 px-4 text-sm text-right text-gray-600">{percentage}%</td>
                        </tr>
                      );
                    })}
                    <tr className="border-t-2 font-semibold">
                      <td className="py-2 px-4 text-sm text-gray-800">Total</td>
                      <td className="py-2 px-4 text-sm text-right text-gray-800">
                        {formatCurrency(totalExpenses)}
                      </td>
                      <td className="py-2 px-4 text-sm text-right text-gray-600">100%</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

