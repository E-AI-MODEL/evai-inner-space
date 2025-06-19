
import { Settings, BarChart, Shield, LogIn } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

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
  const isOnAdminPage = location.pathname === '/admin';

  const handleLogin = async () => {
    // Dit logt de huidige (anonieme) gebruiker uit
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) {
      toast({ title: "Uitloggen mislukt", description: signOutError.message, variant: "destructive" });
      return;
    }

    // Supabase maakt automatisch een nieuwe anonieme sessie aan.
    // We herladen de pagina om zeker te weten dat alle state wordt gereset.
    toast({ title: "Nieuwe Anonieme Sessie Gestart", description: "Je vorige sessie is gewist." });
    window.location.reload();
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
          onClick={handleLogin}
          className="p-2 hover:bg-zinc-100 rounded-lg transition-colors"
          aria-label="Start Nieuwe Anonieme Sessie"
        >
          <LogIn size={22} />
        </button>
        
        <button
          type="button"
          onClick={onSettingsClick}
          className="p-2 rounded-lg hover:bg-zinc-100 transition-colors"
          aria-label="Instellingen openen"
        >
          <Settings size={22} />
        </button>
      </div>
    </header>
  );
};

export default TopBar;
