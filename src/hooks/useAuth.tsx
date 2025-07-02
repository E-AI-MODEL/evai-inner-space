
import { createContext, useContext, useEffect, useState } from 'react';

interface User { id: string; email: string; }

export const ANONYMOUS_SUPER_USER: User = {
  id: '00000000-0000-0000-0000-000000000001',
  email: 'evai_single_user@system.local',
};

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthorized: boolean;
  isAdminAuthorized: boolean;
  authorizeChat: () => void;
  authorizeAdmin: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user] = useState<User>(ANONYMOUS_SUPER_USER); // Altijd de single user
  const [loading, setLoading] = useState(false); // Geen loading meer nodig
  const [isAuthorized] = useState(true); // Altijd geautoriseerd
  const [isAdminAuthorized] = useState(true); // Altijd admin geautoriseerd

  useEffect(() => {
    // Single user model - geen authenticatie nodig
    setLoading(false);
  }, []);

  const authorizeChat = () => {
    // Geen actie nodig - altijd geautoriseerd
  };

  const authorizeAdmin = () => {
    // Geen actie nodig - altijd geautoriseerd
  };
  
  const value = { user, loading, isAuthorized, isAdminAuthorized, authorizeChat, authorizeAdmin };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
