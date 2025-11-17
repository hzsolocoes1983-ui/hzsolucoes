import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from './components/ErrorBoundary';

// Pages
import LoginPage from './pages/Login';
import DashboardPage from './pages/Dashboard';
import TransactionsPage from './pages/Transactions';
import GoalsPage from './pages/Goals';
import ItemsPage from './pages/Items';
import ReportsPage from './pages/Reports';

// Layout
// Layout removido temporariamente até existir o componente

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Protected Route Component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');
  
  if (!token || !user) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
};

// Public Route Component (redirect if authenticated)
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  // Sempre mostra a rota pública (Login) ao abrir o site
  return <>{children}</>;
};

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <Router>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            } />
            
            {/* Protected Routes */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            } />
            
            <Route path="/transactions" element={
              <ProtectedRoute>
                <TransactionsPage />
              </ProtectedRoute>
            } />
            
            <Route path="/goals" element={
              <ProtectedRoute>
                <GoalsPage />
              </ProtectedRoute>
            } />
            
            <Route path="/items" element={
              <ProtectedRoute>
                <ItemsPage />
              </ProtectedRoute>
            } />
            
            <Route path="/reports" element={
              <ProtectedRoute>
                <ReportsPage />
              </ProtectedRoute>
            } />
            
            {/* Catch all - redirect to dashboard if authenticated, login if not */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}