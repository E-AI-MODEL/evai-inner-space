
import { createContext, useContext, useEffect, useState } from 'react';

interface User {
  id: string;
  email: string;
  user_metadata?: any;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthorized: boolean;
  authorize: () => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Fixed anonymous super-user for all Supabase operations
const ANONYMOUS_SUPER_USER: User = {
  id: '00000000-0000-0000-0000-000000000001',
  email: 'anonymous@evai.app',
  user_metadata: { full_name: 'EvAI Anonymous User' }
};

const AUTHORIZATION_KEY = 'evai-authorized';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    // Check if user was previously authorized
    const wasAuthorized = localStorage.getItem(AUTHORIZATION_KEY) === 'true';
    
    if (wasAuthorized) {
      setIsAuthorized(true);
      setUser(ANONYMOUS_SUPER_USER);
    }
    
    setLoading(false);
  }, []);

  const authorize = () => {
    console.log('🎯 Easter egg activated - User authorized!');
    localStorage.setItem(AUTHORIZATION_KEY, 'true');
    setIsAuthorized(true);
    setUser(ANONYMOUS_SUPER_USER);
  };

  const signOut = async () => {
    localStorage.removeItem(AUTHORIZATION_KEY);
    setIsAuthorized(false);
    setUser(null);
  };

  const value = {
    user,
    loading,
    isAuthorized,
    authorize,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
