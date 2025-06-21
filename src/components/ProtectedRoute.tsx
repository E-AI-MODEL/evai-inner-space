
import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import AuthPage from '@/pages/AuthPage';
import { Brain } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <Brain className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Laden...</p>
        </div>
      </div>
    );
  }

  // If no user is logged in, show the auth page
  if (!user) {
    return <AuthPage />;
  }

  // User is authenticated, show the protected content
  return <>{children}</>;
};

export default ProtectedRoute;
