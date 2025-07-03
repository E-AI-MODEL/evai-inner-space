
import { createContext, useContext, useState, useCallback } from 'react';

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
  const [user] = useState<User>(ANONYMOUS_SUPER_USER);
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isAdminAuthorized, setIsAdminAuthorized] = useState(true); // Admin is voorlopig altijd toegankelijk
  
  const authorizeChat = useCallback(() => {
    // Check of er al een sessie is. Zo niet, start een nieuwe.
    if (!sessionStorage.getItem('evai-session-authorized')) {
      sessionStorage.setItem('evai-session-authorized', 'true');
    }
    setIsAuthorized(true);
    setLoading(false);
  }, []);
  
  // Deze functie blijft voor nu eenvoudig, kan later worden uitgebreid
  const authorizeAdmin = useCallback(() => {
    setIsAdminAuthorized(true);
  }, []);
  
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
