/**
 * Converte string brasileira (com vírgula) para número
 * Ex: "1.234,56" -> 1234.56
 */
export function parseBrazilianNumber(value: string): number {
  if (!value) return 0;
  // Remove espaços e substitui vírgula por ponto
  const cleaned = value.trim().replace(/\./g, '').replace(',', '.');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Formata número para moeda brasileira
 */
export function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function formatCurrencyInput(value: string): string {
  if (value === undefined || value === null) return '';
  const num = parseBrazilianNumber(value);
  return Number.isFinite(num)
    ? num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : '';
}

/**
 * Valida se o usuário está autenticado
 */
export function getAuthenticatedUser(): { id: number; name: string; whatsapp: string } | null {
  try {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    
    const user = JSON.parse(userStr);
    if (!user || !user.id) return null;
    
    // Garante que user.id seja um número
    return {
      ...user,
      id: typeof user.id === 'string' ? parseInt(user.id, 10) : user.id
    };
  } catch (error) {
    console.error('Erro ao parsear user do localStorage:', error);
    return null;
  }
}

/**
 * Redireciona para login se não autenticado
 */
export function requireAuth(): { id: number; name: string; whatsapp: string } {
  const user = getAuthenticatedUser();
  if (!user) {
    window.location.href = '/';
    throw new Error('Não autenticado');
  }
  return user;
}


