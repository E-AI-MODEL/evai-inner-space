
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Brain, Mail, Lock, User, AlertCircle, CheckCircle } from 'lucide-react';
import { testSupabaseConnection } from '@/integrations/supabase/client';

const AuthPage: React.FC = () => {
  const { signIn, signUp, loading } = useAuth();
  const navigate = useNavigate();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('signin');
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'error'>('checking');

  // Test connection on mount
  useEffect(() => {
    const testConnection = async () => {
      const result = await testSupabaseConnection();
      setConnectionStatus(result.success ? 'connected' : 'error');
      if (!result.success) {
        setError(`Connectie probleem: ${result.error}`);
      }
    };
    testConnection();
  }, []);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    if (!email.trim() || !password) {
      setError('Email en wachtwoord zijn verplicht.');
      setIsSubmitting(false);
      return;
    }

    const { error } = await signIn(email.trim(), password);
    
    if (error) {
      console.error('Login error details:', error);
      if (error.message?.includes('Invalid login credentials')) {
        setError('Verkeerde inloggegevens. Controleer je email en wachtwoord.');
      } else if (error.message?.includes('Email not confirmed')) {
        setError('Je account is nog niet bevestigd. Controleer je email voor de bevestigingslink.');
      } else if (error.message?.includes('too many requests')) {
        setError('Te veel inlogpogingen. Probeer het later opnieuw.');
      } else {
        setError(`Inloggen mislukt: ${error.message}`);
      }
    } else {
      setSuccess('Succesvol ingelogd!');
      setTimeout(() => navigate('/'), 1000);
    }
    
    setIsSubmitting(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    if (!email.trim() || !password) {
      setError('Email en wachtwoord zijn verplicht.');
      setIsSubmitting(false);
      return;
    }

    if (password.length < 6) {
      setError('Wachtwoord moet minimaal 6 karakters lang zijn.');
      setIsSubmitting(false);
      return;
    }

    const { error } = await signUp(email.trim(), password, fullName);
    
    if (error) {
      console.error('Signup error details:', error);
      if (error.message?.includes('User already registered')) {
        setError('Dit email adres is al geregistreerd. Probeer in te loggen.');
        setActiveTab('signin');
      } else if (error.message?.includes('Password should be at least')) {
        setError('Wachtwoord moet sterker zijn. Gebruik minimaal 6 karakters.');
      } else {
        setError(`Registratie mislukt: ${error.message}`);
      }
    } else {
      setSuccess('Account succesvol aangemaakt! Je kunt nu inloggen.');
      setActiveTab('signin');
      setPassword('');
    }
    
    setIsSubmitting(false);
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
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full">
              <Brain className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-lg sm:text-xl font-bold bg-gradient-to-r from-purple-700 via-blue-700 to-indigo-700 bg-clip-text text-transparent">
            Welkom bij EvAI
          </CardTitle>
          <CardDescription className="text-gray-600 text-sm sm:text-base">
            Log in of maak een account aan om toegang te krijgen tot EvAI.
          </CardDescription>
          
          {/* Connection Status */}
          <div className="flex items-center justify-center gap-2 mt-2">
            {connectionStatus === 'checking' && (
              <div className="flex items-center gap-2 text-yellow-600 text-xs">
                <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                <span>Verbinding controleren...</span>
              </div>
            )}
            {connectionStatus === 'connected' && (
              <div className="flex items-center gap-2 text-green-600 text-xs">
                <CheckCircle className="w-3 h-3" />
                <span>Verbonden met database</span>
              </div>
            )}
            {connectionStatus === 'error' && (
              <div className="flex items-center gap-2 text-red-600 text-xs">
                <AlertCircle className="w-3 h-3" />
                <span>Verbindingsprobleem</span>
              </div>
            )}
          </div>
        </CardHeader>
        
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Inloggen</TabsTrigger>
              <TabsTrigger value="signup">Registreren</TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin" className="space-y-4 mt-4">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder="je@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      required
                      disabled={isSubmitting || connectionStatus === 'error'}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="signin-password">Wachtwoord</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="signin-password"
                      type="password"
                      placeholder="Voer je wachtwoord in"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10"
                      required
                      disabled={isSubmitting || connectionStatus === 'error'}
                    />
                  </div>
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isSubmitting || connectionStatus === 'error'}
                >
                  {isSubmitting ? 'Inloggen...' : 'Inloggen'}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup" className="space-y-4 mt-4">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Volledige naam (optioneel)</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder="Je volledige naam"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="pl-10"
                      disabled={isSubmitting || connectionStatus === 'error'}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="je@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      required
                      disabled={isSubmitting || connectionStatus === 'error'}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Wachtwoord</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="Minimaal 6 karakters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10"
                      required
                      minLength={6}
                      disabled={isSubmitting || connectionStatus === 'error'}
                    />
                  </div>
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isSubmitting || connectionStatus === 'error'}
                >
                  {isSubmitting ? 'Account aanmaken...' : 'Account aanmaken'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          {/* Status Messages */}
          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {success && (
            <Alert className="mt-4 border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-700">{success}</AlertDescription>
            </Alert>
          )}
          
          {connectionStatus === 'error' && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Er is een probleem met de database verbinding. Probeer de pagina te verversen.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthPage;
