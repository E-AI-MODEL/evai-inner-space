import React, { useState } from 'react';
import { Brain, Settings, User, LogOut, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import RubricsEngineStatusIndicator from './rubrics/RubricsEngineStatusIndicator';
import RubricsToggleControl from './rubrics/RubricsToggleControl';
import { Message } from '../types';

interface TopBarProps {
  onSettingsClick: () => void;
  onRubricsToggle: () => void;
  showRubrics: boolean;
  showRubricsButton: boolean;
  messages: Message[];
}

const TopBar: React.FC<TopBarProps> = ({
  onSettingsClick,
  onRubricsToggle,
  showRubrics,
  showRubricsButton,
  messages
}) => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const isMobile = useIsMobile();
  const [analyticsMode, setAnalyticsMode] = useState<'compact' | 'full'>('compact');

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/auth');
    } catch (error) {
      toast({
        title: "Fout bij uitloggen",
        description: "Er ging iets mis bij het uitloggen. Probeer het opnieuw.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="bg-white border-b border-zinc-200 px-3 sm:px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Brain className="text-blue-600" size={24} />
          <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-purple-700 via-blue-700 to-indigo-700 bg-clip-text text-transparent">
            EvAI
          </h1>
        </div>
        
        {/* Enhanced Rubrics Toggle */}
        {showRubricsButton && (
          <RubricsToggleControl
            isActive={showRubrics}
            onToggle={onRubricsToggle}
            messages={messages}
            mode={analyticsMode}
            onModeChange={setAnalyticsMode}
          />
        )}
      </div>
      
      <div className="flex items-center gap-2">
        {/* Status indicator for mobile */}
        {isMobile && showRubricsButton && (
          <div className="block sm:hidden">
            <RubricsEngineStatusIndicator messages={messages} isActive={showRubrics} />
          </div>
        )}

        <Button
          onClick={onSettingsClick}
          variant="ghost"
          size="sm"
          className="p-2"
          aria-label="Instellingen openen"
        >
          <Settings size={18} />
        </Button>

        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="p-2">
                <User size={18} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-white border border-gray-200 shadow-lg">
              <DropdownMenuItem onClick={() => navigate('/admin')}>
                <Shield className="mr-2 h-4 w-4" />
                Admin Dashboard
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                Uitloggen
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
};

export default TopBar;
