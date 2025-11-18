import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Modal } from '../components/ui/modal';
// GoalCircle será usado inline
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { trpcFetch } from '../lib/trpc';
import { formatCurrency, parseBrazilianNumber, requireAuth } from '../lib/utils';

export default function GoalsPage() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  
  const queryClient = useQueryClient();
  
  const user = requireAuth();

  const { data: goals = [], isLoading } = useQuery({
    queryKey: ['goals', user.id],
    queryFn: async () => {
      const userId = typeof user.id === 'string' ? parseInt(user.id, 10) : user.id;
      return await trpcFetch<any[]>('getGoals', { userId: userId });
    },
  });

  const addGoal = useMutation({
    mutationFn: async () => {
      const amount = parseBrazilianNumber(targetAmount);
      if (!amount || amount <= 0) {
        throw new Error('Valor inválido');
      }
      
      const userId = typeof user.id === 'string' ? parseInt(user.id, 10) : user.id;
      
      await trpcFetch('addGoal', {
        userId: userId,
        name,
        targetAmount: amount,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      setShowAddModal(false);
      setName('');
      setTargetAmount('');
      alert('Meta criada com sucesso!');
    },
    onError: (error: any) => {
      alert('Erro: ' + error.message);
    }
  });


  const getProgress = (current: number, target: number) => {
    if (target === 0) return 0;
    return Math.min((current / target) * 100, 100);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white shadow-sm p-4 sticky top-0 z-10">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">Metas Financeiras</h1>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => setShowAddModal(true)}>
              + Nova Meta
            </Button>
            <Button variant="outline" size="sm" onClick={() => window.history.back()}>
              Voltar
            </Button>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4 max-w-6xl mx-auto">
        {isLoading ? (
          <div className="text-center py-8 text-gray-500">Carregando...</div>
        ) : goals.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-gray-500">
              Nenhuma meta criada ainda. Crie sua primeira meta!
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {goals.map((goal: any) => {
              const progress = getProgress(goal.currentAmount, goal.targetAmount);
              const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);
              return (
                <Card key={goal.id}>
                  <CardHeader>
                    <CardTitle className="text-lg">{goal.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-center mb-4">
                      <div className="relative w-32 h-32">
                        <svg className="transform -rotate-90 w-32 h-32">
                          <circle
                            cx="64"
                            cy="64"
                            r="56"
                            stroke="#e5e7eb"
                            strokeWidth="8"
                            fill="none"
                          />
                          <circle
                            cx="64"
                            cy="64"
                            r="56"
                            stroke="#3b82f6"
                            strokeWidth="8"
                            fill="none"
                            strokeDasharray={`${2 * Math.PI * 56}`}
                            strokeDashoffset={`${2 * Math.PI * 56 * (1 - progress / 100)}`}
                            strokeLinecap="round"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-gray-800">{progress.toFixed(0)}%</div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2 text-center">
                      <div className="text-sm text-gray-600">
                        Progresso: {formatCurrency(goal.currentAmount)} / {formatCurrency(goal.targetAmount)}
                      </div>
                      <div className="text-sm font-semibold text-gray-800">
                        Faltam: {formatCurrency(remaining)}
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Adicionar Meta */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Nova Meta">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Meta</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ex: Viagem, Carro, Casa..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Valor Alvo (R$)</label>
            <input
              type="text"
              value={targetAmount}
              onChange={(e) => setTargetAmount(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0,00"
            />
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={() => addGoal.mutate()} 
              disabled={addGoal.isPending || !name || !targetAmount} 
              className="flex-1"
            >
              {addGoal.isPending ? 'Salvando...' : 'Criar Meta'}
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

