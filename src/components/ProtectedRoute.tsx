
import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

interface ProtectedRouteProps {
  children?: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

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

  // If no user is logged in, redirect to auth page
  if (!user) {
    console.log('🛡️ No user found, redirecting to /auth');
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // User is authenticated, show the protected content or nested routes
  console.log('🛡️ User authenticated, showing protected content');
  if (children) {
    return <>{children}</>;
  }
  return <Outlet />;
};

export default ProtectedRoute;
