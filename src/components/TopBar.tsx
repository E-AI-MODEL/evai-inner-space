
import { Settings, BarChart, Shield, LogOut, User, Loader2 } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { useState } from 'react';

interface TopBarProps {
  onSettingsClick: () => void;
  onRubricsToggle?: () => void;
  showRubrics?: boolean;
  showRubricsButton?: boolean;
}

const TopBar = ({ 
  onSettingsClick, 
  onRubricsToggle, 
  showRubrics = false, 
  showRubricsButton = false 
}: TopBarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const isOnAdminPage = location.pathname === '/admin';

  const handleSignOut = async () => {
    setIsSigningOut(true);
    
    try {
      toast({ 
        title: "Uitloggen...", 
        description: "Je wordt uitgelogd uit EvAI.",
      });
      
      await signOut();
      
      toast({ 
        title: "Succesvol uitgelogd", 
        description: "Je bent veilig uitgelogd uit EvAI. Tot ziens!",
      });
      
      // Navigate to home page after successful logout
      navigate('/');
      
    } catch (error) {
      console.error('Logout error:', error);
      toast({ 
        title: "Uitloggen mislukt", 
        description: "Er ging iets mis bij het uitloggen. Probeer het opnieuw.",
        variant: "destructive"
      });
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <header className="flex items-center justify-between h-14 px-6 bg-white/90 shadow-sm border-b border-zinc-100 sticky top-0 z-30 font-inter">
      <div className="flex items-center gap-2">
        <span aria-label="EvAI logo" className="text-2xl select-none">💙</span>
        <span className="font-semibold text-lg tracking-wide text-zinc-800">EvAI Bèta Chat</span>
      </div>
      
      <div className="flex items-center gap-2">
        {showRubricsButton && onRubricsToggle && (
          <button
            onClick={onRubricsToggle}
            className="p-2 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded-lg transition-colors"
            aria-label="EvAI 5.6 Analyse toggle"
          >
            <BarChart size={20} />
          </button>
        )}
        
        {!isOnAdminPage && (
          <button
            onClick={() => navigate('/admin')}
            className="p-2 bg-purple-100 hover:bg-purple-200 text-purple-800 rounded-lg transition-colors"
            aria-label="Admin Dashboard"
          >
            <Shield size={20} />
          </button>
        )}

        <button
          type="button"
          onClick={onSettingsClick}
          className="p-2 rounded-lg hover:bg-zinc-100 transition-colors"
          aria-label="Instellingen openen"
        >
          <Settings size={22} />
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="p-2" disabled={isSigningOut}>
              {isSigningOut ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <User size={20} />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem disabled className="text-xs text-gray-500">
              {user?.email}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={handleSignOut}
              disabled={isSigningOut}
              className="focus:bg-red-50 focus:text-red-600"
            >
              {isSigningOut ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uitloggen...
                </>
              ) : (
                <>
                  <LogOut className="mr-2 h-4 w-4" />
                  Uitloggen
                </>
              )}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default TopBar;
