
import { createContext, useContext, useEffect, useState } from 'react';

interface User {
  id: string;
  email: string;
  user_metadata?: any;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, options?: any) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Single user constant
const SINGLE_USER: User = {
  id: '00000000-0000-0000-0000-000000000001',
  email: 'single-user@evai.app',
  user_metadata: { full_name: 'EvAI Single User' }
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(SINGLE_USER);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Always set the single user as logged in
    setUser(SINGLE_USER);
    setLoading(false);
  }, []);

  const signIn = async (email: string, password: string) => {
    // Mock sign in - always succeeds
    setUser(SINGLE_USER);
  };

  const signUp = async (email: string, password: string, options?: any) => {
    // Mock sign up - always succeeds
    setUser(SINGLE_USER);
  };

  const signOut = async () => {
    // Mock sign out - but immediately sign back in
    setUser(SINGLE_USER);
  };

  const value = {
    user,
    loading,
    signIn,
    signUp,
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
