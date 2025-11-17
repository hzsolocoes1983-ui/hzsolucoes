import { useMemo } from 'react';
import '../styles/login.css';
// Usando o mesmo ícone do PWA público
import { Button } from '@ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@ui/card';
import { useMutation } from '@tanstack/react-query';
import { trpcFetch } from '../lib/trpc';

export default function LoginPage() {
  const envHero = import.meta.env.VITE_LOGIN_HERO as string | undefined; // 'blue-arrows' | 'city-sun' | 'currency-dark'
  const envHeroImage = import.meta.env.VITE_LOGIN_HERO_IMAGE as string | undefined; // e.g. '/login-hero-2025-11.jpg'
  const envAccent = import.meta.env.VITE_LOGIN_ACCENT as string | undefined; // e.g. '#22d3ee'

  const { containerClass, containerStyle } = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    const paramBg = params.get('bg') || undefined; // supports '/file.jpg' or external URL
    const paramAccent = params.get('accent') || undefined;
    const resetBg = params.get('resetbg');

    // Allow quick reset via ?resetbg=1
    if (resetBg) {
      localStorage.removeItem('loginHeroImage');
      localStorage.removeItem('loginAccent');
    }

    // If URL provides overrides, persist them
    if (paramBg) localStorage.setItem('loginHeroImage', paramBg);
    if (paramAccent) localStorage.setItem('loginAccent', paramAccent);

    const lsHeroImage = localStorage.getItem('loginHeroImage') || undefined;
    const lsAccent = localStorage.getItem('loginAccent') || undefined;
    // Fallback: rota mensal alternando entre três fundos
    const monthIndex = new Date().getMonth();
    const monthlyCycle = ['hero-blue-arrows', 'hero-city-sun', 'hero-currency-dark'];
    const fallbackHero = monthlyCycle[monthIndex % monthlyCycle.length];

    // Highest precedence: URL/localStorage, then .env image, then named heroes
    const runtimeImage = paramBg || lsHeroImage;

    if (runtimeImage) {
      return {
        containerClass: `hero-custom flex items-center justify-center p-6`,
        containerStyle: {
          backgroundImage: `url('${runtimeImage}')`,
          ...(paramAccent || lsAccent || envAccent
            ? ({ ['--accent' as any]: (paramAccent || lsAccent || envAccent) } as React.CSSProperties)
            : {}),
        } as React.CSSProperties,
      };
    }

    if (envHeroImage) {
      // Imagem custom definida via .env
      return {
        containerClass: `hero-custom flex items-center justify-center p-6`,
        containerStyle: {
          backgroundImage: `url('${envHeroImage}')`,
          // Permite ajustar acento via .env
          ...(envAccent ? ({ ['--accent' as any]: envAccent } as React.CSSProperties) : {}),
        } as React.CSSProperties,
      };
    }

    const heroClass = envHero ?
      (envHero === 'city-sun' ? 'hero-city-sun' : envHero === 'currency-dark' ? 'hero-currency-dark' : 'hero-blue-arrows')
      : fallbackHero;

    return {
      containerClass: `${heroClass} flex items-center justify-center p-6`,
      containerStyle: envAccent ? ({ ['--accent' as any]: envAccent } as React.CSSProperties) : undefined,
    };
  }, [envHero, envHeroImage, envAccent]);

  const login = useMutation({
    mutationFn: async () => {
      const trpcUrl = import.meta.env.VITE_TRPC_URL || '/trpc';
      console.log('Fazendo login guest... URL:', trpcUrl);

      // Login sem senha: cria/retorna usuário padrão
      // loginGuest não precisa de input, mas tRPC requer um objeto vazio
      const result = await trpcFetch<{ token: string; user: any }>('loginGuest', {});

      return result;
    },
    onSuccess: (data: any) => {
      console.log('Login sucesso:', data);
      localStorage.setItem('token', data.token || 'mock-token');
      localStorage.setItem('user', JSON.stringify(data.user));
      
      // Usa history.pushState para navegação SPA
      window.history.pushState({}, '', '/dashboard');
      window.dispatchEvent(new PopStateEvent('popstate'));
      
      // Fallback: recarrega se não funcionar
      setTimeout(() => {
        if (window.location.pathname !== '/dashboard') {
          window.location.href = '/dashboard';
        }
      }, 100);
    },
    onError: (error: any) => {
      console.error('Erro no login:', error);
      alert('Erro ao fazer login: ' + (error.message || 'Erro desconhecido'));
    }
  });

  return (
    <div className={containerClass} style={containerStyle}>
      <Card
        className="glass-dark !bg-transparent shadow-none text-white w-[92vw] max-w-sm rounded-2xl"
      >
        <CardHeader className="border-b-0 pb-2">
          <div className="flex justify-center mb-2">
            <img
              src="/app-icon.svg?v=3"
              alt="HZ Soluções"
              className="h-16 w-16 rounded-2xl shadow-md ring-2 ring-white/30"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = '/icon-192.png';
              }}
            />
          </div>
          <CardTitle className="brand-title text-center text-2xl font-semibold">HZ Soluções</CardTitle>
        </CardHeader>
        <CardContent className="pt-2">
          {/* Sem campos: login guest com um clique */}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <Button
              onClick={() => {
                console.log('Botão clicado, iniciando login...');
                login.mutate();
              }}
              disabled={login.isPending}
              className="btn-access"
              style={{
                background: '#ffffff',
                color: 'var(--accent, #ff7a00)',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                boxShadow: '0 6px 18px rgba(0, 0, 0, 0.25)',
                height: '44px',
                width: '100%'
              }}
            >
              {login.isPending ? 'Carregando...' : 'Acessar'}
            </Button>
          </div>
        </CardContent>
      </Card>
      <div
        style={{
          position: 'fixed',
          left: 0,
          right: 0,
          bottom: 12,
          textAlign: 'center',
          color: '#DAA520',
          fontWeight: 600,
          letterSpacing: '0.3px',
          zIndex: 50
        }}
      >
        by_La Famiglia
      </div>
    </div>
  );
}