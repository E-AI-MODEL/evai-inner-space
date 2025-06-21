
import { useState, useEffect, createContext, useContext } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('🔐 Setting up auth listener...');
    
    let mounted = true;
    let authCheckTimeout: NodeJS.Timeout;

    // Set timeout to prevent infinite loading
    const setLoadingTimeout = () => {
      authCheckTimeout = setTimeout(() => {
        if (mounted) {
          console.log('⏰ Auth check timeout - setting loading to false');
          setLoading(false);
        }
      }, 5000); // 5 second timeout
    };

    setLoadingTimeout();

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        console.log('🔐 Auth state changed:', event, session?.user?.email || 'No session');
        
        // Clear timeout since we got a response
        if (authCheckTimeout) {
          clearTimeout(authCheckTimeout);
        }
        
        if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);
          setLoading(false);
        }
      }
    );

    // THEN check for existing session
    const getInitialSession = async () => {
      if (!mounted) return;
      
      try {
        console.log('🔍 Checking for existing session...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('🔴 Error getting session:', error);
          if (mounted) {
            setSession(null);
            setUser(null);
            setLoading(false);
          }
        } else {
          console.log('🔐 Initial session check:', session?.user?.email || 'No session');
          if (mounted) {
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);
          }
        }
        
        // Clear timeout since we got a response
        if (authCheckTimeout) {
          clearTimeout(authCheckTimeout);
        }
      } catch (error) {
        console.error('🔴 Session check failed:', error);
        if (mounted) {
          setSession(null);
          setUser(null);
          setLoading(false);
        }
        
        // Clear timeout
        if (authCheckTimeout) {
          clearTimeout(authCheckTimeout);
        }
      }
    };

    getInitialSession();

    return () => {
      mounted = false;
      if (authCheckTimeout) {
        clearTimeout(authCheckTimeout);
      }
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    console.log('🔐 Attempting sign in for:', email);
    setLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password
      });
      
      if (error) {
        console.error('❌ Sign in error:', error);
        setLoading(false);
        return { error };
      } else {
        console.log('✅ Sign in successful for:', data.user?.email);
        // Don't set loading here - let the auth state change handle it
        return { error: null };
      }
    } catch (error) {
      console.error('❌ Sign in exception:', error);
      setLoading(false);
      return { error };
    }
  };

  const signUp = async (email: string, password: string, fullName?: string) => {
    console.log('🔐 Attempting sign up for:', email);
    setLoading(true);
    
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: fullName || email,
          }
        }
      });
      
      if (error) {
        console.error('❌ Sign up error:', error);
        setLoading(false);
        return { error };
      } else {
        console.log('✅ Sign up successful for:', data.user?.email);
        setLoading(false);
        return { error: null };
      }
    } catch (error) {
      console.error('❌ Sign up exception:', error);
      setLoading(false);
      return { error };
    }
  };

  const signOut = async () => {
    console.log('🔐 Signing out...');
    setLoading(true);
    
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('❌ Sign out error:', error);
      } else {
        console.log('✅ Sign out successful');
        setUser(null);
        setSession(null);
      }
    } catch (error) {
      console.error('❌ Sign out exception:', error);
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
