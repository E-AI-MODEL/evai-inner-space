
import { Settings, BarChart, Shield, LogOut, User } from "lucide-react";
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
  const isOnAdminPage = location.pathname === '/admin';

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({ 
        title: "Uitgelogd", 
        description: "Je bent succesvol uitgelogd.",
      });
    } catch (error) {
      toast({ 
        title: "Fout", 
        description: "Er ging iets mis bij het uitloggen.",
        variant: "destructive"
      });
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
            <Button variant="ghost" size="sm" className="p-2">
              <User size={20} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem disabled className="text-xs text-gray-500">
              {user?.email}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Uitloggen
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default TopBar;
