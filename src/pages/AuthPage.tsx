
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Brain } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { testSupabaseConnection } from '@/integrations/supabase/client';
import { useEasterEgg } from '@/hooks/useEasterEgg';
import { useAuthActions } from '@/hooks/useAuthActions';
import { AuthHeader } from '@/components/auth/AuthHeader';
import { SignInForm } from '@/components/auth/SignInForm';
import { SignUpForm } from '@/components/auth/SignUpForm';
import { AuthStatusMessages } from '@/components/auth/AuthStatusMessages';

const AuthPage: React.FC = () => {
  const { loading } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [activeTab, setActiveTab] = useState('signin');
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  
  const {
    isSubmitting,
    error,
    success,
    isResettingPassword,
    handleSignIn,
    handleSignUp,
    handlePasswordReset,
    handleSpecialLogin
  } = useAuthActions();

  const { iconClickCount, handleIconClick } = useEasterEgg(() => 
    handleSpecialLogin(setEmail)
  );

  // Test connection on mount
  useEffect(() => {
    const testConnection = async () => {
      const result = await testSupabaseConnection();
      setConnectionStatus(result.success ? 'connected' : 'error');
      if (!result.success) {
        // Error will be handled by AuthStatusMessages component
      }
    };
    testConnection();
  }, []);

  const onSignInSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSignIn(email, password);
  };

  const onSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newTab = await handleSignUp(email, password, fullName);
    if (newTab) {
      setActiveTab(newTab);
      setPassword('');
    }
  };

  const onPasswordReset = () => {
    handlePasswordReset(email);
  };

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md mx-auto">
        <AuthHeader 
          onIconClick={handleIconClick}
          connectionStatus={connectionStatus}
          iconClickCount={iconClickCount}
        />
        
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Inloggen</TabsTrigger>
              <TabsTrigger value="signup">Registreren</TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin" className="space-y-4 mt-4">
              <SignInForm
                email={email}
                password={password}
                isSubmitting={isSubmitting}
                isResettingPassword={isResettingPassword}
                connectionStatus={connectionStatus}
                onEmailChange={setEmail}
                onPasswordChange={setPassword}
                onSubmit={onSignInSubmit}
                onPasswordReset={onPasswordReset}
              />
            </TabsContent>
            
            <TabsContent value="signup" className="space-y-4 mt-4">
              <SignUpForm
                email={email}
                password={password}
                fullName={fullName}
                isSubmitting={isSubmitting}
                connectionStatus={connectionStatus}
                onEmailChange={setEmail}
                onPasswordChange={setPassword}
                onFullNameChange={setFullName}
                onSubmit={onSignUpSubmit}
              />
            </TabsContent>
          </Tabs>

          <AuthStatusMessages
            error={error}
            success={success}
            connectionStatus={connectionStatus}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthPage;
