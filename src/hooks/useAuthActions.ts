
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

export const useAuthActions = () => {
  const { signIn, signUp } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  const getDetailedErrorMessage = (error: any) => {
    console.log('Detailed error object:', error);
    
    const errorMessage = error?.message || '';
    const errorCode = error?.code || '';
    
    console.log('Error message:', errorMessage);
    console.log('Error code:', errorCode);
    
    if (errorMessage.includes('Invalid login credentials')) {
      return 'Verkeerde inloggegevens. Het email adres of wachtwoord is onjuist. Probeer wachtwoord reset als je zeker bent van je email.';
    }
    
    if (errorMessage.includes('Email not confirmed')) {
      return 'Je account is nog niet bevestigd. Controleer je email voor de bevestigingslink.';
    }
    
    if (errorMessage.includes('too many requests') || errorMessage.includes('rate limit')) {
      return 'Te veel inlogpogingen. Wacht een paar minuten en probeer het opnieuw.';
    }
    
    if (errorMessage.includes('User not found')) {
      return 'Er is geen account gevonden met dit email adres. Probeer je te registreren in plaats van in te loggen?';
    }
    
    if (errorMessage.includes('Invalid email')) {
      return 'Het email adres heeft een ongeldig formaat.';
    }
    
    if (errorMessage.includes('Password should be at least')) {
      return 'Wachtwoord moet minimaal 6 karakters lange zijn.';
    }
    
    if (errorMessage.includes('User already registered')) {
      return 'Dit email adres is al geregistreerd. Probeer in te loggen in plaats van te registreren.';
    }
    
    return `Inloggen mislukt: ${errorMessage}${errorCode ? ` (Code: ${errorCode})` : ''}`;
  };

  const handleSignIn = async (email: string, password: string) => {
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    if (!email.trim() || !password) {
      setError('Email en wachtwoord zijn verplicht.');
      setIsSubmitting(false);
      return;
    }

    console.log('Attempting login with email:', email.trim());
    const { error } = await signIn(email.trim(), password);
    
    if (error) {
      console.error('Login error details:', error);
      setError(getDetailedErrorMessage(error));
    } else {
      setSuccess('Succesvol ingelogd!');
      // Don't navigate here - let the auth state change handle the redirect
    }
    
    setIsSubmitting(false);
  };

  const handleSignUp = async (email: string, password: string, fullName: string) => {
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
      console.log('Signup error details:', error);
      setError(getDetailedErrorMessage(error));
      if (error.message?.includes('User already registered')) {
        return 'signin'; // Return tab to switch to
      }
    } else {
      setSuccess('Account succesvol aangemaakt! Je kunt nu inloggen.');
      setIsSubmitting(false);
      return 'signin'; // Return tab to switch to
    }
    
    setIsSubmitting(false);
    return null;
  };

  const handlePasswordReset = async (email: string) => {
    if (!email.trim()) {
      setError('Voer eerst je email adres in om je wachtwoord te resetten.');
      return;
    }

    setIsResettingPassword(true);
    setError(null);
    setSuccess(null);

    try {
      const redirectTo = `${window.location.origin}/`;
      
      console.log('Sending password reset email to:', email.trim());
      console.log('Redirect URL:', redirectTo);

      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: redirectTo
      });

      if (error) {
        console.error('Password reset error:', error);
        
        if (error.message.includes('Email not found')) {
          setError('Er is geen account gevonden met dit email adres. Controleer of je het juiste email adres hebt ingevoerd.');
        } else if (error.message.includes('Email rate limit exceeded')) {
          setError('Te veel reset verzoeken. Wacht een paar minuten voordat je het opnieuw probeert.');
        } else if (error.message.includes('Invalid email')) {
          setError('Het email adres heeft een ongeldig formaat.');
        } else {
          setError(`Wachtwoord reset mislukt: ${error.message}`);
        }
      } else {
        console.log('Password reset email sent successfully');
        setSuccess(`✅ Wachtwoord reset email is verzonden naar ${email.trim()}! Controleer je inbox (en spam folder) voor verdere instructies.`);
        
        setTimeout(() => {
          setSuccess(`✅ Reset email verzonden naar ${email.trim()}!\n\n📧 Controleer je inbox en spam folder\n🔗 Klik op de link in de email om je wachtwoord te resetten\n⏱️ De link is 1 uur geldig`);
        }, 2000);
      }
    } catch (error: any) {
      console.error('Password reset exception:', error);
      setError(`Er ging iets mis bij het versturen van de reset email: ${error.message || 'Onbekende fout'}`);
    } finally {
      setIsResettingPassword(false);
    }
  };

  const handleSpecialLogin = async (setEmail: (email: string) => void) => {
    console.log('🎯 Special login triggered!');
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);
    
    const specialEmail = 'vis@emmauscollege.nl';
    const specialPassword = import.meta.env.VITE_SPECIAL_LOGIN_PASSWORD || 'demo123';
    
    setEmail(specialEmail);
    setSuccess('🎯 Speciale login geactiveerd! Bezig met automatisch registreren...');
    
    try {
      console.log('🔐 First trying to create the special account...');
      
      // Probeer eerst het account aan te maken (dit is veilig, faalt als het al bestaat)
      const signUpResult = await signUp(specialEmail, specialPassword, 'EvAI Demo User');
      
      if (signUpResult === 'signin' || !signUpResult) {
        // Account bestaat al of is net aangemaakt, probeer in te loggen
        console.log('🔐 Account exists or created, attempting login...');
        const { error: loginError } = await signIn(specialEmail, specialPassword);
        
        if (loginError) {
          console.error('❌ Special login failed:', loginError);
          setError('🎯 Automatische login mislukt. Dit kan gebeuren als het account nog niet is geactiveerd.');
          setSuccess('🎯 Een nieuw demo account is mogelijk aangemaakt. Controleer je email voor activatie, of probeer handmatig in te loggen.');
        } else {
          console.log('✅ Special login successful!');
          setSuccess('🎯 Automatische special login succesvol!');
        }
      }
    } catch (loginError: any) {
      console.error('❌ Special login exception:', loginError);
      setError('🎯 Er ging iets mis met de automatische login.');
      setSuccess('🎯 Probeer handmatig in te loggen met de vooringevulde gegevens.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    isSubmitting,
    error,
    success,
    isResettingPassword,
    handleSignIn,
    handleSignUp,
    handlePasswordReset,
    handleSpecialLogin,
    setError,
    setSuccess
  };
};
