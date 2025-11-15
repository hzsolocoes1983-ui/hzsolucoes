import React from 'react';
import LoginPage from './pages/Login';
import DashboardPage from './pages/Dashboard';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

export default function App() {
  const [route, setRoute] = React.useState(() => {
    return location.pathname.replace(/\/*$/, '') || '/';
  });

  React.useEffect(() => {
    const onPop = () => setRoute(location.pathname.replace(/\/*$/, '') || '/');
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {route === '/dashboard' ? <DashboardPage /> : <LoginPage />}
    </QueryClientProvider>
  );
}