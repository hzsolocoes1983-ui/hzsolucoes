import React from 'react';
import LoginPage from './pages/Login';
import DashboardPage from './pages/Dashboard';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

export default function App() {
  const [route, setRoute] = React.useState(() => {
    const path = window.location.pathname.replace(/\/*$/, '') || '/';
    console.log('Rota inicial:', path);
    return path;
  });

  React.useEffect(() => {
    const checkRoute = () => {
      const path = window.location.pathname.replace(/\/*$/, '') || '/';
      console.log('Rota mudou para:', path);
      setRoute(path);
    };
    
    // Verifica rota quando há mudanças
    const interval = setInterval(checkRoute, 200);
    
    const onPop = () => {
      console.log('PopState event');
      checkRoute();
    };
    
    // Escuta mudanças de rota
    window.addEventListener('popstate', onPop);
    
    // Escuta mudanças de hash (fallback)
    window.addEventListener('hashchange', checkRoute);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('popstate', onPop);
      window.removeEventListener('hashchange', checkRoute);
    };
  }, []);

  // Redireciona para dashboard se já estiver logado
  React.useEffect(() => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    if (token && user && route === '/') {
      console.log('Usuário logado, redirecionando para dashboard');
      window.history.pushState({}, '', '/dashboard');
      setRoute('/dashboard');
    }
  }, [route]);

  console.log('Renderizando rota:', route);

  return (
    <QueryClientProvider client={queryClient}>
      {route === '/dashboard' ? <DashboardPage /> : <LoginPage />}
    </QueryClientProvider>
  );
}