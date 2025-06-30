
import { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { AuthProvider } from "@/hooks/useAuth";
import AdminProtectedRoute from "./components/AdminProtectedRoute";

const Index = lazy(() => import("./pages/Index"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AdminGuide = lazy(() => import("./pages/AdminGuide"));
const TestPage = lazy(() => import("./pages/TestPage"));
const NotFound = lazy(() => import("./pages/NotFound"));
const AccessDenied = lazy(() => import("./pages/AccessDenied"));

const queryClient = new QueryClient();


const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Suspense fallback={<div>Loading...</div>}>
            <Routes>
              <Route path="/" element={<Index />} />
              {/* Beveiligde Admin Routes */}
              <Route element={<AdminProtectedRoute />}> 
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/guide" element={<AdminGuide />} />
              </Route>
              <Route path="/test" element={<TestPage />} />
              <Route path="/access-denied" element={<AccessDenied />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
