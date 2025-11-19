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
  updateTransaction: {
    input: { id: number; userId: number; type?: 'income' | 'expense'; amount?: number; description?: string; category?: string; isFixed?: boolean };
    output: void;
  };
  deleteTransaction: {
    input: { id: number; userId: number };
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
  };  addWaterIntake: {
    input: { userId: number; amount: number };
    output: void;
  };
  getAccounts: {
    input: { userId: number };
    output: any[];
  };
  addAccount: {
    input: { userId: number; name: string; type: 'checking' | 'savings' | 'investment'; balance?: number; icon?: string };
    output: void;
  };
  updateAccount: {
    input: { id: number; userId: number; name?: string; balance?: number; icon?: string };
    output: void;
  };
  deleteAccount: {
    input: { id: number; userId: number };
    output: void;
  };
}; getExpensesByCategory: {
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
  // Procedimentos que são mutation no backend (POST)
  const MUTATIONS = new Set([
    'login',
    'loginGuest',
    'addGoal',
    'addTransaction',
    'updateTransaction',
    'deleteTransaction',
    'addItem',
    'updateItemStatus',
    'markDailyCare',
    'addWaterIntake',
    'addAccount',
    'updateAccount',
    'deleteAccount',
  ]);
  const isMutation = MUTATIONS.has(procedure);

  // O tRPC Express adapter espera a URL no formato /trpc/[procedure]
  // Se TRPC_URL já termina com /trpc, usa direto, senão adiciona
  let baseUrl = TRPC_URL;
  if (!baseUrl.endsWith('/trpc')) {
    baseUrl = baseUrl.endsWith('/') ? `${baseUrl}trpc` : `${baseUrl}/trpc`;
  }
  // Para queries, o adapter espera GET com input serializado em querystring
  // Para mutations, usa POST com body { input }
  const url = isMutation
    ? `${baseUrl}/${procedure}`
    : `${baseUrl}/${procedure}?input=${encodeURIComponent(JSON.stringify(input ?? {}))}`;
  
  console.log(`[tRPC] ${procedure}`, { 
    TRPC_URL, 
    baseUrl, 
    url, 
    input,
    inputType: typeof input,
    inputKeys: input ? Object.keys(input) : []
  });
  
  try {
    // O tRPC Express adapter espera o formato: { input: <dados> } para mutations
    // Vamos garantir que o input seja sempre um objeto válido e não undefined
    if (!input) {
      console.error(`[tRPC] Input é undefined/null para ${procedure}`);
      throw new Error(`Input inválido para ${procedure}: input não pode ser undefined ou null`);
    }
    
    if (typeof input !== 'object' || Array.isArray(input)) {
      console.error(`[tRPC] Input deve ser um objeto para ${procedure}, recebido:`, typeof input, input);
      throw new Error(`Input inválido para ${procedure}: deve ser um objeto`);
    }
    
    // O tRPC Express adapter espera o input diretamente no body, não dentro de {input: ...}
    const requestBody = input;
    
    console.log(`[tRPC] ${procedure} - Request body:`, JSON.stringify(requestBody, null, 2));
    console.log(`[tRPC] ${procedure} - Input keys:`, Object.keys(input));
    console.log(`[tRPC] ${procedure} - Input values:`, Object.values(input));
    console.log(`[tRPC] ${procedure} - Input completo:`, input);
    
    const response = await fetch(url, isMutation
      ? {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(requestBody),
        }
      : {
          method: 'GET',
          headers: { 'Accept': 'application/json' },
        }
    );

    const responseText = await response.text();
    console.log(`[tRPC] Response status: ${response.status}`);
    console.log(`[tRPC] Response text:`, responseText);

    if (!response.ok) {
      console.error(`[tRPC] Erro HTTP ${response.status}:`, responseText);
      
      // Tenta parsear o erro como JSON para extrair mensagem mais amigável
      try {
        const errorJson = JSON.parse(responseText);
        if (errorJson.error?.message) {
          // Se a mensagem for um array de erros do Zod, tenta formatar melhor
          let errorMessage = errorJson.error.message;
          if (typeof errorMessage === 'string' && errorMessage.includes('invalid_type')) {
            try {
              const zodErrors = JSON.parse(errorMessage);
              if (Array.isArray(zodErrors)) {
                const formattedErrors = zodErrors.map((err: any) => 
                  `${err.path?.join('.') || 'campo'}: ${err.message || 'erro de validação'}`
                ).join(', ');
                errorMessage = `Erro de validação: ${formattedErrors}`;
              }
            } catch {
              // Se não conseguir parsear, usa a mensagem original
            }
          }
          throw new Error(errorMessage);
        }
        // Se for um array de erros do tRPC
        if (Array.isArray(errorJson) && errorJson[0]?.result?.error) {
          const error = errorJson[0].result.error;
          throw new Error(error.message || JSON.stringify(error));
        }
      } catch (parseError) {
        // Se não conseguir parsear, usa o texto direto
      }
      
      throw new Error(`HTTP ${response.status}: ${responseText}`);
    }

    const data = JSON.parse(responseText);
    console.log(`[tRPC] Resposta ${procedure}:`, data);
    
    // tRPC pode retornar diretamente { result: { data: { json: T } } } ou { data: T }
    if (data.result?.data?.json !== undefined) {
      return data.result.data.json as T;
    }
    if (data.result?.data !== undefined) {
      return data.result.data as T;
    }
    if (data.data !== undefined) {
      return data.data as T;
    }
    
    // tRPC retorna: [{ result: { data: { json: T } } }] para batch
    if (Array.isArray(data) && data.length > 0 && data[0]?.result) {
      const result = data[0].result;
      
      // Se houver erro
      if (result.error) {
        console.error(`[tRPC] Erro na resposta:`, result.error);
        // Extrai mensagem de erro de forma mais amigável
        let errorMessage = 'Erro desconhecido';
        
        if (typeof result.error.message === 'string') {
          errorMessage = result.error.message;
        } else if (result.error.data?.code) {
          errorMessage = `Erro ${result.error.data.code}: ${result.error.message || 'Erro na validação'}`;
        } else {
          errorMessage = JSON.stringify(result.error);
        }
        
        throw new Error(errorMessage);
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
