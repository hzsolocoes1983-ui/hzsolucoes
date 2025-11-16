import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';

// Allow configuring TRPC base URL via Vite env in production
// Falls back to relative '/trpc' when served under the same domain.
const TRPC_URL = import.meta.env.VITE_TRPC_URL || '/trpc';

// Tipo do router (deve corresponder ao backend)
type AppRouter = {
  login: {
    input: { whatsapp: string; password: string };
    output: { token: string; user: any };
  };
  register: {
    input: { whatsapp: string; name: string; password: string };
    output: void;
  };
  getGoals: {
    input: { userId?: number };
    output: any[];
  };
  addGoal: {
    input: { userId: number; name: string; targetAmount: number };
    output: void;
  };
  getMonthlyTotal: {
    input: { year: number; month: number; userId?: number };
    output: number;
  };
  getMonthlyExpensesTotal: {
    input: { year: number; month: number; userId?: number };
    output: number;
  };
  getFixedExpenses: {
    input: { userId?: number };
    output: any[];
  };
  getTransactions: {
    input: { userId: number; year?: number; month?: number; type?: 'income' | 'expense' };
    output: any[];
  };
  addTransaction: {
    input: { userId: number; type: 'income' | 'expense'; amount: number; description?: string; category?: string; isFixed?: boolean; date?: Date };
    output: void;
  };
  getItems: {
    input: { userId: number; status?: 'pending' | 'bought' };
    output: any[];
  };
  addItem: {
    input: { userId: number; name: string; price?: number };
    output: void;
  };
  updateItemStatus: {
    input: { id: number; status: 'pending' | 'bought' };
    output: void;
  };
  getDailyCare: {
    input: { userId: number; date?: Date; type?: string };
    output: any[];
  };
  markDailyCare: {
    input: { userId: number; type: string; scheduledTime?: string };
    output: void;
  };
  getWaterIntake: {
    input: { userId: number; date?: Date };
    output: { total: number; intakes: any[] };
  };
  addWaterIntake: {
    input: { userId: number; amount: number };
    output: void;
  };
  getExpensesByCategory: {
    input: { year: number; month: number; userId?: number };
    output: any[];
  };
  getExpensesByUser: {
    input: { year: number; month: number };
    output: any[];
  };
};

export const trpc = createTRPCProxyClient<AppRouter>({
  links: [httpBatchLink({ url: TRPC_URL })],
});

// Helper function simplificado para fazer chamadas tRPC via fetch
// Usa o formato correto do tRPC Express adapter
export async function trpcFetch<T>(
  procedure: string,
  input: any
): Promise<T> {
  const url = `${TRPC_URL}/${procedure}`;
  
  console.log(`[tRPC] ${procedure}`, { url, input });
  
  try {
    // Formato do tRPC v10 com Express adapter
    // O body deve ser um array com objetos no formato batch
    const response = await fetch(url, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        "0": {
          "json": input
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[tRPC] Erro HTTP ${response.status}:`, errorText);
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log(`[tRPC] Resposta ${procedure}:`, data);
    
    // tRPC retorna: [{ result: { data: { json: T } } }]
    if (Array.isArray(data) && data[0]?.result) {
      const result = data[0].result;
      
      // Se houver erro
      if (result.error) {
        console.error(`[tRPC] Erro na resposta:`, result.error);
        throw new Error(result.error.message || 'Erro desconhecido');
      }
      
      // Retorna os dados
      if (result.data?.json !== undefined) {
        return result.data.json as T;
      }
      if (result.data !== undefined) {
        return result.data as T;
      }
    }
    
    // Fallback: retorna data direto se não encontrar o formato esperado
    console.warn(`[tRPC] Formato inesperado para ${procedure}, retornando data direto`);
    return data as T;
  } catch (error: any) {
    console.error(`[tRPC] Erro ao chamar ${procedure}:`, error);
    throw error;
  }
}
