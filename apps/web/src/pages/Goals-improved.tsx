import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Modal } from '../components/ui/modal';
import { Input } from '../components/ui/input';
import { useToast } from '../components/ui/toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { trpcFetch } from '../lib/trpc';
import { formatCurrency, parseBrazilianNumber, requireAuth } from '../lib/utils';
import { useFormValidation, goalSchema } from '../hooks/useFormValidation';
import { useErrorHandler } from '../hooks/useErrorHandler';

export default function GoalsPage() {
  const [showAddModal, setShowAddModal] = useState(false);
  
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const handleError = useErrorHandler();
  const user = requireAuth();

  const { register, handleSubmit, formState: { errors }, reset } = useFormValidation(goalSchema);

  const { data: goals = [], isLoading } = useQuery({
    queryKey: ['goals', user.id],
    queryFn: async () => {
      const userId = typeof user.id === 'string' ? parseInt(user.id, 10) : user.id;
      return await trpcFetch<any[]>('getGoals', { userId: userId });
    },
  });

  const addGoal = useMutation({
    mutationFn: async (data: any) => {
      const targetAmount = parseBrazilianNumber(data.targetAmount);
      const currentAmount = data.currentAmount ? parseBrazilianNumber(data.currentAmount) : 0;
      const userId = typeof user.id === 'string' ? parseInt(user.id, 10) : user.id;
      
      await trpcFetch('addGoal', {
        userId: userId,
        name: data.name,
        targetAmount,
        currentAmount,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      setShowAddModal(false);
      reset();
      showToast('Meta criada com sucesso!', 'success');
    },
    onError: (error: any) => {
      handleError(error, 'Erro ao criar meta');
    }
  });

  const deleteGoal = useMutation({
    mutationFn: async (goalId: number) => {
      const userId = typeof user.id === 'string' ? parseInt(user.id, 10) : user.id;
      await trpcFetch('deleteGoal', {
        id: goalId,
        userId: userId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      showToast('Meta excluída com sucesso!', 'success');
    },
    onError: (error: any) => {
      handleError(error, 'Erro ao excluir meta');
    }
  });

  const handleDelete = (goal: any) => {
    if (window.confirm(`Tem certeza que deseja excluir a meta "${goal.name}"?`)) {
      deleteGoal.mutate(goal.id);
    }
  };

  const getProgress = (current: number, target: number) => {
    if (target === 0) return 0;
    return Math.min((current / target) * 100, 100);
  };

  const onSubmit = handleSubmit((data) => {
    addGoal.mutate(data);
  });

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white shadow-sm p-4 sticky top-0 z-10">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">Metas Financeiras</h1>
          <div className="flex gap-2">
            <Button 
              size="sm" 
              onClick={() => {
                reset();
                setShowAddModal(true);
              }}
            >
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2].map(i => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="animate-pulse">
                    <div className="h-32 w-32 bg-gray-200 rounded-full mx-auto mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2 mx-auto"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : goals.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-gray-500">
              <div className="text-6xl mb-4">🎯</div>
              <p className="text-lg mb-2">Nenhuma meta criada ainda</p>
              <p className="text-sm">Crie sua primeira meta financeira e comece a economizar!</p>
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
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{goal.name}</CardTitle>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(goal)}
                        className="text-xs px-2 py-1 h-auto text-red-600 hover:bg-red-50"
                      >
                        Excluir
                      </Button>
                    </div>
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
                            className="transition-all duration-500"
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
                          className="bg-blue-600 h-2 rounded-full transition-all duration-500"
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
        <form onSubmit={onSubmit} className="space-y-4">
          <Input
            label="Nome da Meta"
            placeholder="Ex: Viagem para Europa"
            error={errors.name?.message}
            {...register('name')}
            required
          />

          <Input
            label="Valor Alvo"
            placeholder="0,00"
            error={errors.targetAmount?.message}
            {...register('targetAmount')}
            required
            helperText="Quanto você quer economizar?"
          />

          <Input
            label="Valor Atual (Opcional)"
            placeholder="0,00"
            error={errors.currentAmount?.message}
            {...register('currentAmount')}
            helperText="Quanto você já tem economizado?"
          />

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
              disabled={addGoal.isPending}
            >
              {addGoal.isPending ? 'Criando...' : 'Criar Meta'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
