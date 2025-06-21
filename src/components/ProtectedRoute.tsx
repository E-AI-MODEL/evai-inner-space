
import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import AuthPage from '@/pages/AuthPage';

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
          <div className="animate-pulse text-2xl mb-4">💙</div>
          <p className="text-gray-600">Laden...</p>
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
