
import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import AuthPage from '@/pages/AuthPage';
import { Brain } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();

  console.log('🛡️ ProtectedRoute - Loading:', loading, 'User:', user?.email || 'No user');

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <Brain className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Laden...</p>
          <p className="text-xs text-gray-400 mt-2">Authenticatie controleren...</p>
        </div>
      </div>
    );
  }

  // If no user is logged in, show the auth page
  if (!user) {
    console.log('🛡️ No user found, showing auth page');
    return <AuthPage />;
  }

  // User is authenticated, show the protected content
  console.log('🛡️ User authenticated, showing protected content');
  return <>{children}</>;
};

export default ProtectedRoute;
