import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Modal } from '../components/ui/modal';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { trpcFetch } from '../lib/trpc';
import { formatCurrency, parseBrazilianNumber, formatCurrencyInput, getAuthenticatedUser } from '../lib/utils';

export default function Dashboard() {
  const navigate = useNavigate();
  // Hooks devem vir primeiro, antes de qualquer return condicional
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const queryClient = useQueryClient();
  
  // Estados dos modais
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showIncomeModal, setShowIncomeModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showQuickModal, setShowQuickModal] = useState(false);
  const [quickText, setQuickText] = useState('');
  const [quickDetectedType, setQuickDetectedType] = useState<'income' | 'expense' | null>(null);
  const [quickDetectedAmount, setQuickDetectedAmount] = useState<number | null>(null);
  const [showItemModal, setShowItemModal] = useState(false);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [showCareConfigModal, setShowCareConfigModal] = useState(false);
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseDesc, setExpenseDesc] = useState('');
  const [incomeAmount, setIncomeAmount] = useState('');
  const [incomeDesc, setIncomeDesc] = useState('');
  const [itemName, setItemName] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  const [hormonesTime, setHormonesTime] = useState(localStorage.getItem('care_hormones_time') || '07:00');
  const [medicineTime, setMedicineTime] = useState(localStorage.getItem('care_medicine_time') || '08:00');
  const [foodTime, setFoodTime] = useState(localStorage.getItem('care_food_time') || '08:30');
  const [exerciseTime, setExerciseTime] = useState(localStorage.getItem('care_exercise_time') || '11:10');
  const [expandedBank, setExpandedBank] = useState<string | null>(null);
  
  // Verifica autenticação
  const user = getAuthenticatedUser();
  
  useEffect(() => {
    if (!user) {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);
  
  if (!user) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Redirecionando para login...</p>
      </div>
    );
  }

  const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth() + 1;

  // Resumo financeiro
  const { data: summary = { revenue: 0, expenses: 0, fixed: 0, balance: 0 }, isLoading, error: summaryError } = useQuery({
    queryKey: ['summary', year, month, user.id],
    queryFn: async () => {
      try {
        if (!user?.id) {
          throw new Error('Usuário não encontrado. Faça login novamente.');
        }
        
        console.log('Buscando resumo para user:', user.id, 'mês:', month, 'ano:', year);
        
        const [revenue, expenses, fixedExpenses] = await Promise.all([
          trpcFetch<number>('getMonthlyTotal', { year, month, userId: user.id }),
          trpcFetch<number>('getMonthlyExpensesTotal', { year, month, userId: user.id }),
          trpcFetch<any[]>('getFixedExpenses', { userId: user.id })
        ]);

        const fixedTotal = fixedExpenses.reduce((sum, exp) => sum + exp.amount, 0);

        return {
          revenue,
          expenses,
          fixed: fixedTotal,
          balance: revenue - expenses - fixedTotal
        };
      } catch (error: any) {
        console.error('Erro ao buscar resumo:', error);
        // Mostra erro no console e retorna valores padrão
        if (error.message) {
          console.error('Detalhes do erro:', error.message);
        }
        return { revenue: 0, expenses: 0, fixed: 0, balance: 0 };
      }
    },
    retry: 1,
  });

  // Transações recentes (últimas 5 despesas)
  const { data: recentExpenses = [], isLoading: loadingExpenses } = useQuery({
    queryKey: ['recentExpenses', user.id],
    queryFn: async () => {
      try {
        if (!user?.id) return [];
        const transactions = await trpcFetch<any[]>('getTransactions', {
          userId: user.id,
          type: 'expense'
        });
        return transactions.slice(0, 5);
      } catch (error: any) {
        console.error('Erro ao buscar despesas:', error);
        return [];
      }
    },
    retry: 1,
  });

  // Itens pendentes
  const { data: pendingItems = [], isLoading: loadingItems } = useQuery({
    queryKey: ['pendingItems', user.id],
    queryFn: async () => {
      try {
        if (!user?.id) return [];
        return await trpcFetch<any[]>('getItems', {
          userId: user.id,
          status: 'pending'
        });
      } catch (error: any) {
        console.error('Erro ao buscar itens:', error);
        return [];
      }
    },
    retry: 1,
  });

  // Consumo de água do dia
  const { data: waterData = { total: 0, intakes: [] }, isLoading: loadingWater } = useQuery({
    queryKey: ['waterIntake', user.id, new Date().toDateString()],
    queryFn: async () => {
      try {
        if (!user?.id) return { total: 0, intakes: [] };
        // tRPC aceita string ISO ou Date
        const today = new Date();
        return await trpcFetch<{ total: number; intakes: any[] }>('getWaterIntake', {
          userId: user.id,
          date: today.toISOString()
        });
      } catch (error: any) {
        console.error('Erro ao buscar água:', error);
        return { total: 0, intakes: [] };
      }
    },
    retry: 1,
  });

  // Cuidados do dia
  const { data: dailyCareData = [], isLoading: loadingCare } = useQuery({
    queryKey: ['dailyCare', user.id, new Date().toDateString()],
    queryFn: async () => {
      try {
        if (!user?.id) return [];
        const today = new Date();
        return await trpcFetch<any[]>('getDailyCare', {
          userId: user.id,
          date: today.toISOString()
        });
      } catch (error: any) {
        console.error('Erro ao buscar cuidados:', error);
        return [];
      }
    },
    retry: 1,
  });

  // Helper para verificar se um cuidado foi marcado hoje
  const isCareMarked = (type: string) => {
    return dailyCareData.some((care: any) => care.type === type && care.completed);
  };

  // Mutations
  const addExpense = useMutation({
    mutationFn: async () => {
      if (!user?.id) {
        throw new Error('Usuário não encontrado. Faça login novamente.');
      }
      const amount = parseBrazilianNumber(expenseAmount);
      if (!amount || amount <= 0) {
        throw new Error('Valor inválido');
      }
      
      // Garante que userId seja um número
      const userId = typeof user.id === 'string' ? parseInt(user.id, 10) : user.id;
      
      const input = {
        userId: userId,
        type: 'expense' as const,
        amount: amount,
        description: expenseDesc || undefined,
      };
      
      console.log('[Dashboard] Enviando addTransaction:', input);
      console.log('[Dashboard] User ID type:', typeof userId, 'value:', userId);
      console.log('[Dashboard] Amount type:', typeof amount, 'value:', amount);
      
      await trpcFetch('addTransaction', input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['summary'] });
      queryClient.invalidateQueries({ queryKey: ['recentExpenses'] });
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
      if (!user?.id) {
        throw new Error('Usuário não encontrado. Faça login novamente.');
      }
      const amount = parseBrazilianNumber(incomeAmount);
      if (!amount || amount <= 0) {
        throw new Error('Valor inválido');
      }
      
      // Garante que userId seja um número
      const userId = typeof user.id === 'string' ? parseInt(user.id, 10) : user.id;
      
      const input = {
        userId: userId,
        type: 'income' as const,
        amount: amount,
        description: incomeDesc || undefined,
      };
      
      console.log('[Dashboard] Enviando addTransaction:', input);
      console.log('[Dashboard] User ID type:', typeof userId, 'value:', userId);
      console.log('[Dashboard] Amount type:', typeof amount, 'value:', amount);
      
      await trpcFetch('addTransaction', input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['summary'] });
      queryClient.invalidateQueries({ queryKey: ['recentExpenses'] });
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
      if (!user?.id) {
        throw new Error('Usuário não encontrado. Faça login novamente.');
      }
      await trpcFetch('addItem', {
        userId: user.id,
        name: itemName,
        price: itemPrice ? parseBrazilianNumber(itemPrice) : undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pendingItems'] });
      setShowItemModal(false);
      setItemName('');
      setItemPrice('');
      alert('Item adicionado com sucesso!');
    },
    onError: (error: any) => {
      alert('Erro: ' + error.message);
    }
  });

  // Quick add mutation (auto classifica Receita/Despesa)
  const addQuick = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('Usuário não encontrado. Faça login novamente.');

      // Detecta amount e tipo a partir do texto
      const analyze = (text: string) => {
        const lower = text.toLowerCase();

        const incomeKeywords = ['receita', 'salario', 'salário', 'ganho', 'ganhei', 'entrada', 'freelance', 'freelancer', 'pix', 'depósito', 'deposito', 'bonus', 'bônus'];
        const expenseKeywords = ['despesa', 'pagar', 'pagamento', 'parcela', 'conta', 'aluguel', 'mercado', 'farmacia', 'farmácia', 'combustivel', 'combustível', 'gasolina', 'fatura', 'cartão', 'cartao', 'boleto', 'compra', 'compras'];

        const hasIncome = incomeKeywords.some(k => lower.includes(k));
        const hasExpense = expenseKeywords.some(k => lower.includes(k));

        let type: 'income' | 'expense' = hasIncome && !hasExpense ? 'income' : 'expense';

        // Extrai primeiro número (suporta 1.234,56 | 1234,56 | 1234.56 | 1234)
        const numMatch = lower.match(/\d{1,3}(?:\.\d{3})*,\d{2}|\d+(?:[\.,]\d{2})?|\d+/);
        let amount = 0;
        if (numMatch) {
          const raw = numMatch[0];
          // Normaliza para formato brasileiro e usa parser existente
          const normalized = raw.replace(/\./g, '').replace(/,/g, '.');
          amount = parseFloat(normalized);
        }

        return { type, amount };
      };

      const { type, amount } = analyze(quickText);
      if (!amount || amount <= 0) throw new Error('Informe um valor válido no texto.');

      // Garante que userId seja número
      const userId = typeof user.id === 'string' ? parseInt(user.id, 10) : user.id;

      const input = {
        userId,
        type,
        amount,
        description: quickText || undefined,
      } as const;

      await trpcFetch('addTransaction', input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['summary'] });
      queryClient.invalidateQueries({ queryKey: ['recentExpenses'] });
      setQuickText('');
      setShowQuickModal(false);
      alert('Registro salvo com sucesso!');
    },
    onError: (error: any) => alert('Erro: ' + error.message)
  });

  // Atualiza preview de detecção quando o usuário digita
  useEffect(() => {
    const text = quickText.trim();
    if (!text) {
      setQuickDetectedType(null);
      setQuickDetectedAmount(null);
      return;
    }
    const lower = text.toLowerCase();
    const incomeKeywords = ['receita', 'salario', 'salário', 'ganho', 'ganhei', 'entrada', 'freelance', 'freelancer', 'pix', 'depósito', 'deposito', 'bonus', 'bônus'];
    const expenseKeywords = ['despesa', 'pagar', 'pagamento', 'parcela', 'conta', 'aluguel', 'mercado', 'farmacia', 'farmácia', 'combustivel', 'combustível', 'gasolina', 'fatura', 'cartão', 'cartao', 'boleto', 'compra', 'compras'];
    const hasIncome = incomeKeywords.some(k => lower.includes(k));
    const hasExpense = expenseKeywords.some(k => lower.includes(k));
    const type = hasIncome && !hasExpense ? 'income' : 'expense';
    const numMatch = lower.match(/\d{1,3}(?:\.\d{3})*,\d{2}|\d+(?:[\.,]\d{2})?|\d+/);
    let amount: number | null = null;
    if (numMatch) {
      const normalized = numMatch[0].replace(/\./g, '').replace(/,/g, '.');
      amount = parseFloat(normalized);
    }
    setQuickDetectedType(type);
    setQuickDetectedAmount(amount);
  }, [quickText]);

  const addWater = useMutation({
    mutationFn: async () => {
      await trpcFetch('addWaterIntake', {
        userId: user.id,
        amount: 200,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['waterIntake'] });
      alert('200ml de água adicionado!');
    },
    onError: (error: any) => {
      alert('Erro: ' + error.message);
    }
  });

  const markCare = useMutation({
    mutationFn: async (type: string) => {
      const time = (type === 'hormones' && hormonesTime) || (type === 'medicine' && medicineTime) || (type === 'food' && foodTime) || (type === 'exercise' && exerciseTime) || '07:00';
      await trpcFetch('markDailyCare', {
        userId: user.id,
        type,
        scheduledTime: time,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dailyCare'] });
      alert('Marcado com sucesso!');
    },
    onError: (error: any) => {
      alert('Erro: ' + error.message);
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
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-950 pb-20" style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}>
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm p-4">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Hz Soluções</h1>
            <p className="text-sm text-gray-600 dark:text-gray-300">Bem-vindo, {user.name || 'Usuário'}!</p>
          </div>
          <div className="flex gap-2 items-center">
            <Button variant="outline" onClick={() => {
              const root = document.documentElement;
              const next = !root.classList.contains('dark');
              if (next) {
                root.classList.add('dark');
                localStorage.setItem('theme', 'dark');
              } else {
                root.classList.remove('dark');
                localStorage.setItem('theme', 'light');
              }
            }}>
              Modo escuro
            </Button>
            <Button variant="outline" onClick={() => { localStorage.clear(); location.reload(); }}>
              Sair
            </Button>
          </div>
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

      <div className="p-4 space-y-6 max-w-6xl mx-auto bg-gray-50 dark:bg-neutral-950 min-h-screen">
        {/* Mensagem de erro se houver */}
        {summaryError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800 text-sm font-medium">
              ⚠️ Erro ao carregar dados
            </p>
            <p className="text-red-700 text-xs mt-1">
              Verifique o console do navegador (F12) para mais detalhes.
              {!user?.id && ' Usuário não encontrado. Faça login novamente.'}
            </p>
            <p className="text-red-600 text-xs mt-2">
              URL do backend: {import.meta.env.VITE_TRPC_URL || '/trpc'}
            </p>
          </div>
        )}
        
        {/* Debug info (apenas em desenvolvimento) */}
        {import.meta.env.DEV && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs">
            <p className="text-blue-800 font-medium">🔍 Debug Info:</p>
            <p className="text-blue-700">User ID: {user?.id || 'Não encontrado'}</p>
            <p className="text-blue-700">TRPC URL: {import.meta.env.VITE_TRPC_URL || '/trpc'}</p>
            <p className="text-blue-700">Mês/Ano: {month}/{year}</p>
          </div>
        )}
        
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
            <Button variant="outline" size="sm" onClick={() => setShowCalendarModal(true)}>Ver calendário</Button>
            <Button variant="outline" size="sm" onClick={() => setShowCareConfigModal(true)}>Configurar rotina</Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card className={`${isCareMarked('hormones') || isCareMarked('medicine') ? 'bg-green-50 border-green-300' : 'bg-blue-50 border-blue-200'}`}>
              <CardContent className="p-3 touch-manipulation">
                <div className="text-center">
                  <div className="text-2xl mb-2">💊</div>
                  <div className="text-xs font-medium mb-1">Remédios</div>
                  <div className="text-xs text-gray-600 mb-1">
                    {isCareMarked('hormones') && isCareMarked('medicine') ? '✓ Ambos concluídos' :
                     isCareMarked('hormones') ? 'Hormônios: 07:00 ✓' :
                     isCareMarked('medicine') ? 'Remédio: 08:00 ✓' :
                     'Hormônios: 07:00 | Remédio: 08:00'}
                  </div>
                  {loadingCare ? (
                    <span className="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded mb-2">Carregando...</span>
                  ) : (isCareMarked('hormones') && isCareMarked('medicine')) ? (
                    <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded mb-2">✓ Concluído</span>
                  ) : (
                    <span className="inline-block bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded mb-2">Pendente</span>
                  )}
                  {(!isCareMarked('hormones') || !isCareMarked('medicine')) && (
                    <div className="space-y-1 mt-2">
                      {/* Ocultamos o botão de Hormônios conforme solicitado */}
                      {!isCareMarked('medicine') && (
                        <Button 
                          size="sm" 
                          className="w-full text-xs touch-manipulation min-h-[32px]" 
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            markCare.mutate('medicine');
                          }} 
                          disabled={markCare.isPending}
                          style={{ touchAction: 'manipulation' }}
                        >
                          {markCare.isPending ? '...' : 'Remédio'}
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className={`${isCareMarked('food') ? 'bg-green-50 border-green-300' : 'bg-green-50 border-green-200'}`}>
              <CardContent className="p-3 touch-manipulation">
                <div className="text-center">
                  <div className="text-2xl mb-2">🍴</div>
                  <div className="text-xs font-medium mb-1">Alimentação</div>
                  <div className="text-xs text-gray-600 mb-1">Próxima: Café às 08:30</div>
                  {loadingCare ? (
                    <span className="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded mb-2">Carregando...</span>
                  ) : isCareMarked('food') ? (
                    <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded mb-2">✓ Concluído</span>
                  ) : null}
                  <Button 
                    size="sm" 
                    className="w-full text-xs mt-2 touch-manipulation min-h-[32px]" 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      markCare.mutate('food');
                    }} 
                    disabled={markCare.isPending}
                    style={{ touchAction: 'manipulation' }}
                  >
                    {markCare.isPending ? '...' : isCareMarked('food') ? 'Marcar próxima' : 'Marcar'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-cyan-50 border-cyan-200">
              <CardContent className="p-3 touch-manipulation">
                <div className="text-center">
                  <div className="text-2xl mb-2">💧</div>
                  <div className="text-xs font-medium mb-1">Água</div>
                  <div className="text-xs text-gray-600 mb-1">Meta 2000ml</div>
                  <div className="text-xs font-semibold mb-2">
                    {loadingWater ? '...' : `${waterData.total}ml / 2000ml`}
                  </div>
                  <div className="text-xs text-gray-500 mb-2">
                    {loadingWater ? '' : `${Math.round((waterData.total / 2000) * 100)}% da meta`}
                  </div>
                  <Button 
                    size="sm" 
                    className="w-full text-xs touch-manipulation min-h-[32px]" 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      addWater.mutate();
                    }} 
                    disabled={addWater.isPending}
                    style={{ touchAction: 'manipulation' }}
                  >
                    {addWater.isPending ? '...' : '+200ml'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className={`${isCareMarked('exercise') ? 'bg-green-50 border-green-300' : 'bg-purple-50 border-purple-200'}`}>
              <CardContent className="p-3 touch-manipulation">
                <div className="text-center">
                  <div className="text-2xl mb-2">🏋️</div>
                  <div className="text-xs font-medium mb-1">Exercício</div>
                  <div className="text-xs text-gray-600 mb-1">Horário 11:10</div>
                  {loadingCare ? (
                    <span className="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded mb-2">Carregando...</span>
                  ) : isCareMarked('exercise') ? (
                    <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded mb-2">✓ Concluído</span>
                  ) : null}
                  <Button 
                    size="sm" 
                    className="w-full text-xs mt-2 touch-manipulation min-h-[32px]" 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      markCare.mutate('exercise');
                    }} 
                    disabled={markCare.isPending}
                    style={{ touchAction: 'manipulation' }}
                  >
                    {markCare.isPending ? '...' : isCareMarked('exercise') ? 'Marcar novamente' : 'Marcar'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Resumo */}
        <div>
          <h2 className="text-lg font-semibold mb-3 text-gray-700 dark:text-neutral-100">Visão rápida dos principais números</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card className="bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-green-100 rounded flex items-center justify-center">
                    <span className="text-green-600 text-lg">↑</span>
                  </div>
                  <div className="text-xs text-gray-600 dark:text-neutral-300">Receita do mês</div>
                </div>
                <div className="text-xl font-bold text-gray-800 dark:text-neutral-100">
                  {isLoading ? '...' : formatCurrency(summary.revenue)}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-pink-100 rounded flex items-center justify-center">
                    <span className="text-pink-600 text-lg">~</span>
                  </div>
                  <div className="text-xs text-gray-600 dark:text-neutral-300">Gastos variáveis</div>
                </div>
                <div className="text-xl font-bold text-gray-800 dark:text-neutral-100">
                  {isLoading ? '...' : formatCurrency(summary.expenses)}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-yellow-100 rounded flex items-center justify-center">
                    <span className="text-yellow-600 text-lg">~</span>
                  </div>
                  <div className="text-xs text-gray-600 dark:text-neutral-300">Mensais</div>
                </div>
                <div className="text-xl font-bold text-gray-800 dark:text-neutral-100">
                  {isLoading ? '...' : formatCurrency(summary.fixed)}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-sm text-white border-0">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-white/20 rounded flex items-center justify-center">
                    <span className="text-white text-lg">■</span>
                  </div>
                  <div className="text-xs text-white">Saldo</div>
                </div>
                <div className={`text-xl font-bold text-white`}>
                  {isLoading ? '...' : formatCurrency(summary.balance)}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Ações Rápidas */}
        <div>
          <h2 className="text-lg font-semibold mb-3 text-gray-700 dark:text-neutral-100">Atalhos para suas rotinas diárias</h2>
          <div className="grid grid-cols-2 md:grid-cols-2 gap-3">
            <Card className="cursor-pointer hover:shadow-md active:scale-95 transition touch-manipulation bg-white/10 backdrop-blur-sm text-white border-0" style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}>
              <CardContent className="p-4 text-center">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-white text-xl">🎯</span>
                </div>
                <div className="text-sm font-medium text-white">Metas</div>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md active:scale-95 transition touch-manipulation bg-white/10 backdrop-blur-sm text-white border-0" style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}>
              <CardContent className="p-4 text-center">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-white text-xl">💼</span>
                </div>
                <div className="text-sm font-medium text-white">Projetos e investimentos</div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-3 text-gray-700 dark:text-gray-200">Contas Bancárias</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { key: 'itau', name: 'Itaú', bg: '#ff6b00', fg: '#ffffff', border: '#cc5600', logo: 'https://upload.wikimedia.org/wikipedia/commons/3/37/Ita%C3%BA_Unibanco_logo_2023.svg' },
              { key: 'santander', name: 'Santander', bg: '#ec0000', fg: '#ffffff', border: '#b00000', logo: 'https://upload.wikimedia.org/wikipedia/commons/2/25/Banco_Santander_Logotipo.svg' },
              { key: 'bb', name: 'Banco do Brasil', bg: '#ffdd00', fg: '#002776', border: '#e6c800', logo: 'https://upload.wikimedia.org/wikipedia/commons/8/8f/Banco_do_Brasil_logo.svg' },
              { key: 'bradesco', name: 'Bradesco', bg: '#c41e3a', fg: '#ffffff', border: '#9f1830', logo: 'https://upload.wikimedia.org/wikipedia/commons/f/f2/Banco_Bradesco_logo.svg' },
              { key: 'caixa', name: 'Caixa', bg: '#0c5fa8', fg: '#ffffff', border: '#084a86', logo: 'https://upload.wikimedia.org/wikipedia/commons/1/15/Caixa_Econ%C3%B4mica_Federal_logo_1997.svg' },
              { key: 'nubank', name: 'Nubank', bg: '#820ad1', fg: '#ffffff', border: '#6a08ac', logo: 'https://upload.wikimedia.org/wikipedia/commons/5/5f/Nubank_logo_2021.svg' },
            ].map((b) => (
              <Card
                key={b.key}
                style={{ borderColor: b.border, backgroundColor: b.bg }}
                className="cursor-pointer hover:shadow-md active:scale-[0.99] transition"
                onClick={() => setExpandedBank(expandedBank === b.key ? null : b.key)}
                aria-expanded={expandedBank === b.key}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded bg-white/20 flex items-center justify-center">
                      <span className="text-white font-bold text-sm">{b.name[0]}</span>
                    </div>
                    <div className="font-semibold text-white">{b.name}</div>
                  </div>
                  {expandedBank === b.key && (
                    <div className="mt-1">
                      <div className="text-xs text-white/90">Saldo</div>
                      <div className="text-sm font-bold text-white">R$ 0,00</div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        
      </div>

      {/* Navegação Inferior */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-neutral-900 border-t border-gray-200 dark:border-neutral-800 px-4 py-2">
        <div className="flex justify-around items-center max-w-md mx-auto">
          <button 
            className="flex flex-col items-center gap-1 text-gray-600 dark:text-neutral-300"
            onClick={() => window.location.href = '/dashboard'}
          >
            <span className="text-xl">🏠</span>
            <span className="text-xs">Início</span>
          </button>
          <button 
            className="flex flex-col items-center gap-1 text-gray-600 dark:text-neutral-300"
            onClick={() => window.location.href = '/transactions'}
          >
            <span className="text-xl">~</span>
            <span className="text-xs">Transações</span>
          </button>
          <button 
            className="w-14 h-14 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-lg"
            onClick={() => setShowAddModal(true)}
          >
            <span className="text-2xl">+</span>
          </button>
          <button 
            className="flex flex-col items-center gap-1 text-gray-600 dark:text-neutral-300"
            onClick={() => window.location.href = '/reports'}
          >
            <span className="text-xl">📊</span>
            <span className="text-xs">Relatórios</span>
          </button>
          <button 
            className="flex flex-col items-center gap-1 text-gray-600 dark:text-neutral-300"
            onClick={() => window.location.href = '/items'}
          >
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
              type="text"
              value={expenseAmount}
              onChange={(e) => setExpenseAmount(e.target.value)}
              onBlur={() => setExpenseAmount(formatCurrencyInput(expenseAmount))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0,00"
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

      <Modal isOpen={showIncomeModal} onClose={() => setShowIncomeModal(false)} title="Registrar Receita">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Valor (R$)</label>
            <input
              type="text"
              value={incomeAmount}
              onChange={(e) => setIncomeAmount(e.target.value)}
              onBlur={() => setIncomeAmount(formatCurrencyInput(incomeAmount))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0,00"
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

      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="O que deseja registrar?">
        <div className="space-y-3">
          <Button 
            className="w-full" 
            onClick={() => { setShowAddModal(false); setShowExpenseModal(true); }}
          >
            Despesa
          </Button>
          <Button 
            className="w-full" 
            variant="outline"
            onClick={() => { setShowAddModal(false); setShowIncomeModal(true); }}
          >
            Receita
          </Button>
          <Button 
            className="w-full" 
            variant="secondary"
            onClick={() => { setShowAddModal(false); setShowQuickModal(true); }}
          >
            Registro rápido (texto)
          </Button>
        </div>
      </Modal>

      {/* Registro rápido com detecção automática */}
      <Modal isOpen={showQuickModal} onClose={() => setShowQuickModal(false)} title="Registro rápido (auto)">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Texto</label>
            <input
              type="text"
              value={quickText}
              onChange={(e) => setQuickText(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ex: 2000 parcela carro ou 3000 ganho freelance"
            />
          </div>
          <div className="text-xs text-gray-600">
            Detectado: {quickDetectedType === 'income' ? 'Receita' : quickDetectedType === 'expense' ? 'Despesa' : '—'}
            {typeof quickDetectedAmount === 'number' ? ` • Valor: R$ ${quickDetectedAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : ''}
          </div>
          <div className="flex gap-2">
            <Button onClick={() => addQuick.mutate()} disabled={addQuick.isPending || !quickText.trim()} className="flex-1">
              {addQuick.isPending ? 'Salvando...' : 'Salvar'}
            </Button>
            <Button variant="outline" onClick={() => setShowQuickModal(false)}>Cancelar</Button>
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

      <Modal isOpen={showCalendarModal} onClose={() => setShowCalendarModal(false)} title="Calendário do Dia">
        <div className="space-y-3">
          {loadingCare ? (
            <div className="text-sm text-gray-500">Carregando...</div>
          ) : dailyCareData.length === 0 ? (
            <div className="text-sm text-gray-500">Nenhum cuidado marcado hoje.</div>
          ) : (
            <div className="space-y-2">
              {dailyCareData.map((care: any) => (
                <div key={care.id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                  <div className="text-sm text-gray-800">{care.type}</div>
                  <div className="text-xs text-gray-600">{care.scheduledTime || '—'} • {new Date(care.date).toLocaleTimeString('pt-BR')}</div>
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowCalendarModal(false)} className="flex-1">Fechar</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showCareConfigModal} onClose={() => setShowCareConfigModal(false)} title="Configurar Rotina">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hormônios</label>
            <input type="time" value={hormonesTime} onChange={(e) => setHormonesTime(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Remédio</label>
            <input type="time" value={medicineTime} onChange={(e) => setMedicineTime(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Alimentação</label>
            <input type="time" value={foodTime} onChange={(e) => setFoodTime(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Exercício</label>
            <input type="time" value={exerciseTime} onChange={(e) => setExerciseTime(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={() => {
                localStorage.setItem('care_hormones_time', hormonesTime);
                localStorage.setItem('care_medicine_time', medicineTime);
                localStorage.setItem('care_food_time', foodTime);
                localStorage.setItem('care_exercise_time', exerciseTime);
                setShowCareConfigModal(false);
                alert('Rotina salva');
              }}
              className="flex-1"
            >Salvar</Button>
            <Button variant="outline" onClick={() => setShowCareConfigModal(false)}>Cancelar</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
