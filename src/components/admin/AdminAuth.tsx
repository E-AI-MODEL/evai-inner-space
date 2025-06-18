
import React, { useState } from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { Brain, Shield, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface AdminAuthProps {
  onAuthenticated: () => void;
}

const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || "admin123";

const AdminAuth: React.FC<AdminAuthProps> = ({ onAuthenticated }) => {
  const [password, setPassword] = useState('');
  const [isOpen, setIsOpen] = useState(true);
  const navigate = useNavigate();

  const handleLogin = () => {
    if (password === ADMIN_PASSWORD) {
      onAuthenticated();
      setIsOpen(false);
      toast({
        title: "Toegang verleend",
        description: "Welkom in het EvAI Admin Dashboard.",
      });
    } else {
      toast({
        title: "Verkeerd wachtwoord",
        description: "De ingevoerde code is onjuist.",
        variant: "destructive",
      });
      setPassword('');
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <AlertDialog open={isOpen}>
        <AlertDialogContent className="w-full max-w-md mx-auto relative sm:max-w-lg">
          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 z-10"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Sluiten</span>
          </button>

          <AlertDialogHeader className="text-center pt-2">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full">
                <Shield className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
              </div>
            </div>
            <AlertDialogTitle className="text-lg sm:text-xl font-bold bg-gradient-to-r from-purple-700 via-blue-700 to-indigo-700 bg-clip-text text-transparent">
              EvAI Admin Authenticatie
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600 text-sm sm:text-base px-2">
              Voer het admin wachtwoord in om toegang te krijgen tot het dashboard.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4 px-2">
            <Input
              type="password"
              placeholder="Admin wachtwoord..."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
              className="text-center"
              autoFocus
            />
          </div>
          <AlertDialogFooter className="flex justify-center px-2">
            <Button onClick={handleLogin} className="w-full">
              <Brain className="h-4 w-4 mr-2" />
              Toegang Verkrijgen
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminAuth;
