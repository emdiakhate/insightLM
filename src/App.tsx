import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import Notebook from "./pages/Notebook";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import {
  CalculatorPage,
  GeneratorPage,
  SimulationPage,
  DashboardPage as LegalDashboardPage,
  TemplatesPage,
  JurisprudencePage,
} from "./pages/legal";

const queryClient = new QueryClient();

const AppContent = () => {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <ProtectedRoute fallback={<Auth />}>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/notebook"
        element={
          <ProtectedRoute fallback={<Auth />}>
            <Notebook />
          </ProtectedRoute>
        }
      />
      <Route
        path="/notebook/:id"
        element={
          <ProtectedRoute fallback={<Auth />}>
            <Notebook />
          </ProtectedRoute>
        }
      />

      {/* Legal Tools Routes */}
      <Route
        path="/legal/calculator"
        element={
          <ProtectedRoute fallback={<Auth />}>
            <CalculatorPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/legal/generator"
        element={
          <ProtectedRoute fallback={<Auth />}>
            <GeneratorPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/legal/simulation"
        element={
          <ProtectedRoute fallback={<Auth />}>
            <SimulationPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/legal/dashboard"
        element={
          <ProtectedRoute fallback={<Auth />}>
            <LegalDashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/legal/templates"
        element={
          <ProtectedRoute fallback={<Auth />}>
            <TemplatesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/legal/jurisprudence"
        element={
          <ProtectedRoute fallback={<Auth />}>
            <JurisprudencePage />
          </ProtectedRoute>
        }
      />

      <Route path="/auth" element={<Auth />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <LanguageProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppContent />
          </BrowserRouter>
        </AuthProvider>
      </LanguageProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;