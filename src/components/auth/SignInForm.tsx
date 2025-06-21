
import React from 'react';
import { Mail, Lock } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface SignInFormProps {
  email: string;
  password: string;
  isSubmitting: boolean;
  isResettingPassword: boolean;
  connectionStatus: 'checking' | 'connected' | 'error';
  onEmailChange: (email: string) => void;
  onPasswordChange: (password: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onPasswordReset: () => void;
}

export const SignInForm: React.FC<SignInFormProps> = ({
  email,
  password,
  isSubmitting,
  isResettingPassword,
  connectionStatus,
  onEmailChange,
  onPasswordChange,
  onSubmit,
  onPasswordReset
}) => {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="signin-email">Email</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            id="signin-email"
            type="email"
            placeholder="je@email.com"
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
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
            onChange={(e) => onPasswordChange(e.target.value)}
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

      <Button 
        type="button" 
        variant="outline"
        className="w-full" 
        onClick={onPasswordReset}
        disabled={isResettingPassword || connectionStatus === 'error' || !email.trim()}
      >
        {isResettingPassword ? 'Email wordt verzonden...' : 'Wachtwoord vergeten?'}
      </Button>
      
      {!email.trim() && (
        <p className="text-xs text-gray-500 text-center">
          Voer eerst je email adres in om je wachtwoord te resetten
        </p>
      )}
    </form>
  );
};
