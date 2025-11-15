import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';

type RouterShape = {
  login: { mutate: (input: { whatsapp: string; password: string }) => Promise<{ token: string; user: any }> };
  register: { mutate: (input: { whatsapp: string; name: string; password: string }) => Promise<void> };
  getGoals: { query: () => Promise<any[]> };
  getMonthlyTotal: { query: (input: { year: number; month: number }) => Promise<number> };
  getMonthlyExpensesTotal: { query: (input: { year: number; month: number }) => Promise<number> };
};

// Allow configuring TRPC base URL via Vite env in production
// Falls back to relative '/trpc' when served under the same domain.
const TRPC_URL = import.meta.env.VITE_TRPC_URL || '/trpc';

export const trpc = createTRPCProxyClient<RouterShape>({
  links: [httpBatchLink({ url: TRPC_URL })],
});