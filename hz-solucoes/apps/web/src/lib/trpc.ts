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
    input: void;
    output: any[];
  };
  getMonthlyTotal: {
    input: { year: number; month: number };
    output: number;
  };
  getMonthlyExpensesTotal: {
    input: { year: number; month: number };
    output: number;
  };
};

export const trpc = createTRPCProxyClient<AppRouter>({
  links: [httpBatchLink({ url: TRPC_URL })],
});