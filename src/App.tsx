import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "@/components/ProtectedRoute";
import AppLayout from "./components/AppLayout";
import SplashScreen from "./components/SplashScreen";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";

const Landing = lazy(() => import("./pages/Landing"));
const Index = lazy(() => import("./pages/Index"));
const SurveyData = lazy(() => import("./pages/SurveyData"));
const Chat = lazy(() => import("./pages/Chat"));
const Documents = lazy(() => import("./pages/Documents"));
const Estimations = lazy(() => import("./pages/Estimations"));
const Settings = lazy(() => import("./pages/Settings"));

const queryClient = new QueryClient();

function RouteFallback() {
  return (
    <div className="flex min-h-[320px] items-center justify-center bg-background text-foreground">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <SplashScreen>
          <Suspense fallback={<RouteFallback />}>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route
                element={
                  <ProtectedRoute>
                    <AppLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="/dashboard" element={<Index />} />
                <Route path="/survey" element={<SurveyData />} />
                <Route path="/chat" element={<Chat />} />
                <Route path="/documents" element={<Documents />} />
                <Route path="/estimations" element={<Estimations />} />
                <Route path="/settings" element={<Settings />} />
              </Route>
              <Route path="/app" element={<Navigate to="/dashboard" replace />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </SplashScreen>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
