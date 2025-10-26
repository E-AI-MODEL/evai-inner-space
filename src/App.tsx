
import { Suspense, lazy, useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { AuthProvider } from "@/hooks/useAuth";
import { useBrowserTransformerEngine } from "@/hooks/useBrowserTransformerEngine";
import { ConsentBanner } from "@/components/ConsentBanner";

const Index = lazy(() => import("./pages/Index"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AdminGuide = lazy(() => import("./pages/AdminGuide"));
const TestPage = lazy(() => import("./pages/TestPage"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const AppContent = () => {
  const { preloadModel } = useBrowserTransformerEngine();

  // Preload ML model in background on app mount (non-blocking)
  useEffect(() => {
    const loadModel = async () => {
      try {
        console.log('🚀 App: Preloading Browser Transformer model...');
        await preloadModel();
      } catch (error) {
        console.warn('⚠️ App: ML model preload failed (app will continue without browser ML):', error);
      }
    };
    loadModel();
  }, [preloadModel]);

  return (
    <BrowserRouter>
      <Suspense fallback={<div>Loading...</div>}>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/guide" element={<AdminGuide />} />
          <Route path="/test" element={<TestPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <ConsentBanner />
        <AppContent />
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
