import React from 'react';
import LoginPage from './pages/Login';
import DashboardPage from './pages/Dashboard';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

export default function App() {
  const [route, setRoute] = React.useState(() => {
    const path = window.location.pathname.replace(/\/*$/, '') || '/';
    return path;
  });

  React.useEffect(() => {
    const checkRoute = () => {
      const path = window.location.pathname.replace(/\/*$/, '') || '/';
      setRoute(path);
    };
    
    // Verifica rota periodicamente para detectar mudanças
    const interval = setInterval(checkRoute, 100);
    
    const onPop = () => checkRoute();
    window.addEventListener('popstate', onPop);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('popstate', onPop);
    };
  }, []);

  // Redireciona para dashboard se já estiver logado
  React.useEffect(() => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    if (token && user && route === '/') {
      window.location.href = '/dashboard';
    }
  }, [route]);

  return (
    <QueryClientProvider client={queryClient}>
      {route === '/dashboard' ? <DashboardPage /> : <LoginPage />}
    </QueryClientProvider>
  );
}