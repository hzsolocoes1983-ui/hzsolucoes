import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ToastProvider } from './components/ui/toast';

console.log('[Main] Iniciando aplicação...');

const rootEl = document.getElementById('root');
if (!rootEl) {
  console.error('[Main] Elemento root não encontrado!');
  throw new Error('Elemento root não encontrado');
}

try {
  const root = createRoot(rootEl);
  root.render(
    <React.StrictMode>
      <ErrorBoundary>
        <ToastProvider>
          <App />
        </ToastProvider>
      </ErrorBoundary>
    </React.StrictMode>
  );
  console.log('[Main] Aplicação renderizada com sucesso');
} catch (error) {
  console.error('[Main] Erro ao renderizar aplicação:', error);
  rootEl.innerHTML = `
    <div style="padding: 2rem; text-align: center; font-family: sans-serif;">
      <h1 style="color: #ef4444;">Erro ao carregar aplicação</h1>
      <p style="color: #6b7280;">${error instanceof Error ? error.message : 'Erro desconhecido'}</p>
      <button onclick="window.location.reload()" style="margin-top: 1rem; padding: 0.5rem 1rem; background: #3b82f6; color: white; border: none; border-radius: 0.25rem; cursor: pointer;">
        Recarregar
      </button>
    </div>
  `;
}