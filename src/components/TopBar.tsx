import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Brain, Shield, Settings, User } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface TopBarProps {
  onSettingsClick: () => void;
}

const TopBar: React.FC<TopBarProps> = ({ onSettingsClick }) => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  return (
    <header className="border-b border-zinc-200 bg-white/80 backdrop-blur-sm">
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="h-6 w-6 text-blue-600" />
          <h1 className="text-xl font-bold text-gray-800">EvAI Bèta Chat</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => navigate('/admin')} className="text-gray-600 hover:text-gray-800">
            <Shield className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={onSettingsClick} className="text-gray-600 hover:text-gray-800">
            <Settings className="h-4 w-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-800">
                <User className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{user?.email}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={signOut}>Uitloggen</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default TopBar;
