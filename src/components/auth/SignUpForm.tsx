
import React from 'react';
import { Mail, Lock, User } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface SignUpFormProps {
  email: string;
  password: string;
  fullName: string;
  isSubmitting: boolean;
  connectionStatus: 'checking' | 'connected' | 'error';
  onEmailChange: (email: string) => void;
  onPasswordChange: (password: string) => void;
  onFullNameChange: (fullName: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const SignUpForm: React.FC<SignUpFormProps> = ({
  email,
  password,
  fullName,
  isSubmitting,
  connectionStatus,
  onEmailChange,
  onPasswordChange,
  onFullNameChange,
  onSubmit
}) => {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="signup-name">Volledige naam (optioneel)</Label>
        <div className="relative">
          <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            id="signup-name"
            type="text"
            placeholder="Je volledige naam"
            value={fullName}
            onChange={(e) => onFullNameChange(e.target.value)}
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
            onChange={(e) => onEmailChange(e.target.value)}
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
            onChange={(e) => onPasswordChange(e.target.value)}
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
  );
};
