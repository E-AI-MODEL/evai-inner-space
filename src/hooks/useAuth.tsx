import { createContext, useContext, useEffect, useState } from 'react';

interface User { id: string; email: string; }

export const ANONYMOUS_SUPER_USER: User = {
  id: '00000000-0000-0000-0000-000000000001',
  email: 'evai_superuser@local.host',
};

const CHAT_AUTH_KEY = 'evai_chat_authorized';
const ADMIN_AUTH_KEY = 'evai_admin_authorized';

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
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isAdminAuthorized, setIsAdminAuthorized] = useState(false);

  useEffect(() => {
    try {
      const chatAuth = localStorage.getItem(CHAT_AUTH_KEY) === 'true';
      const adminAuth = localStorage.getItem(ADMIN_AUTH_KEY) === 'true';

      if (chatAuth) {
        setIsAuthorized(true);
        setUser(ANONYMOUS_SUPER_USER);
      }
      if (adminAuth) {
        setIsAdminAuthorized(true);
        if (!chatAuth) setUser(ANONYMOUS_SUPER_USER);
      }
    } catch (e) {
      console.error("Could not access localStorage", e);
    }
    setLoading(false);
  }, []);

  const authorizeChat = () => {
    try {
      localStorage.setItem(CHAT_AUTH_KEY, 'true');
    } catch (e) { console.error("Could not write to localStorage", e); }
    setIsAuthorized(true);
    if (!user) setUser(ANONYMOUS_SUPER_USER);
  };

  const authorizeAdmin = () => {
    try {
      localStorage.setItem(ADMIN_AUTH_KEY, 'true');
    } catch (e) { console.error("Could not write to localStorage", e); }
    setIsAdminAuthorized(true);
    if (!user) setUser(ANONYMOUS_SUPER_USER);
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
