import { useCallback } from 'react';
import { useToast } from '../components/ui/toast';

/**
 * Hook para tratamento centralizado de erros
 * 
 * @example
 * const handleError = useErrorHandler();
 * 
 * try {
 *   await someAsyncOperation();
 * } catch (error) {
 *   handleError(error);
 * }
 */
export function useErrorHandler() {
  const { showToast } = useToast();

  const handleError = useCallback((error: unknown, customMessage?: string) => {
    console.error('Erro capturado:', error);

    let errorMessage = customMessage || 'Ocorreu um erro inesperado';

    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    } else if (error && typeof error === 'object' && 'message' in error) {
      errorMessage = String(error.message);
    }

    // Mensagens de erro mais amigáveis
    const friendlyMessages: Record<string, string> = {
      'Failed to fetch': 'Erro de conexão. Verifique sua internet.',
      'Network request failed': 'Erro de rede. Tente novamente.',
      'Credenciais inválidas': 'Usuário ou senha incorretos.',
      'WhatsApp já cadastrado': 'Este WhatsApp já está em uso.',
      'Não autenticado': 'Sessão expirada. Faça login novamente.',
      'Token inválido': 'Sessão expirada. Faça login novamente.',
    };

    const finalMessage = friendlyMessages[errorMessage] || errorMessage;
    showToast(finalMessage, 'error');

    // Se for erro de autenticação, redireciona para login
    if (
      errorMessage.includes('autenticado') ||
      errorMessage.includes('Token') ||
      errorMessage.includes('Sessão')
    ) {
      setTimeout(() => {
        localStorage.removeItem('auth');
        window.location.href = '/';
      }, 2000);
    }

    return finalMessage;
  }, [showToast]);

  return handleError;
}
