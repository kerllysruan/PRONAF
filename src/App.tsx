import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { AgencyProvider } from "@/contexts/AgencyContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Dashboard from "./pages/Dashboard";
import Proposals from "./pages/Proposals";
import Documentation from "./pages/Documentation";
import AccessControl from "./pages/AccessControl";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import AdminAgencies from "./pages/AdminAgencies";
import StockProposals from "./pages/StockProposals";
import FileExchange from "./pages/FileExchange";
import DocumentationSubmit from "./pages/DocumentationSubmit";
import { PermissionGate } from "@/components/auth/PermissionGate";
import { Loader2 } from "lucide-react";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  return <AppLayout>{children}</AppLayout>;
}

function AuthRoute() {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  if (user) return <Navigate to="/" replace />;
  return <Auth />;
}

import { SplashScreen } from "@/components/SplashScreen";
import { useState } from "react";

const AppRoutes = () => (
  <Routes>
    <Route path="/auth" element={<AuthRoute />} />
    <Route path="/" element={<ProtectedRoute><PermissionGate permission="can_view_dashboard" showError><Dashboard /></PermissionGate></ProtectedRoute>} />
    <Route path="/propostas" element={<ProtectedRoute><PermissionGate permission="can_view_proposals" showError><Proposals /></PermissionGate></ProtectedRoute>} />
    <Route path="/estoque" element={<ProtectedRoute><PermissionGate permission="can_view_proposals" showError><StockProposals /></PermissionGate></ProtectedRoute>} />
    <Route path="/troca-arquivos" element={<ProtectedRoute><PermissionGate permission="can_view_proposals" showError><FileExchange /></PermissionGate></ProtectedRoute>} />
    <Route path="/enviar-documentacao" element={<DocumentationSubmit />} />
    <Route path="/documentacao" element={<ProtectedRoute><PermissionGate permission="can_view_documentation" showError><Documentation /></PermissionGate></ProtectedRoute>} />
    <Route path="/controle-acesso" element={<ProtectedRoute><PermissionGate permission="can_view_access_control" showError><AccessControl /></PermissionGate></ProtectedRoute>} />
    <Route path="/admin/agencies" element={<ProtectedRoute><PermissionGate requireAdmin showError><AdminAgencies /></PermissionGate></ProtectedRoute>} />
    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App = () => {
  const [showSplash, setShowSplash] = useState(true);

  if (showSplash) {
    return <SplashScreen onFinished={() => setShowSplash(false)} />;
  }

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AuthProvider>
              <AgencyProvider>
                <AppRoutes />
              </AgencyProvider>
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
