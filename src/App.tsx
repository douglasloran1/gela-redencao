import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import Checkout from "./pages/Checkout.tsx";
import Finalizado from "./pages/Finalizado.tsx";
import Dashboard from "./pages/dashboard/Dashboard.tsx";
import NotFound from "./pages/NotFound.tsx";
import LoginDashboard from "./pages/LoginDashboard.tsx";
import { useAuth } from "@/store/auth";
import { useProdutos } from "@/store/produtos";
import { useBanners } from "@/store/banners";

const queryClient = new QueryClient();

// Protege o dashboard — redireciona para /painel se não logado
const RequireAuth = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/painel" replace />;
};

// Se já estiver logado e tentar acessar /painel, vai direto pro dashboard
const RedirectIfAuth = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <>{children}</>;
};

// Componente interno que inicia as subscriptions Realtime globalmente
const RealtimeProvider = ({ children }: { children: React.ReactNode }) => {
  const iniciarProdutosRealtime = useProdutos((s) => s.iniciarRealtime);
  const iniciarBannersRealtime = useBanners((s) => s.iniciarRealtime);

  useEffect(() => {
    // Inicia subscriptions e guarda as funções de cleanup
    const cancelarProdutos = iniciarProdutosRealtime();
    const cancelarBanners = iniciarBannersRealtime();

    // Cancela as subscriptions quando o app desmontar
    return () => {
      cancelarProdutos();
      cancelarBanners();
    };
  }, []);

  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <RealtimeProvider>
          <Routes>
            {/* ── Loja pública ── */}
            <Route path="/" element={<Index />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/finalizado" element={<Finalizado />} />

            {/* ── Sistema de gestão (separado da loja) ── */}
            <Route
              path="/painel"
              element={
                <RedirectIfAuth>
                  <LoginDashboard />
                </RedirectIfAuth>
              }
            />
            <Route
              path="/dashboard"
              element={
                <RequireAuth>
                  <Dashboard />
                </RequireAuth>
              }
            />

            {/* Rota legada /login redireciona para /painel */}
            <Route path="/login" element={<Navigate to="/painel" replace />} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </RealtimeProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
