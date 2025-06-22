
import React from "react";
import { Button } from "@/components/ui/button";
import { Settings, Brain, Shield } from "lucide-react";
import { Message } from "../types";
import { useNavigate } from "react-router-dom";

interface TopBarProps {
  onSettingsClick: () => void;
  showRubricsButton?: boolean;
  showRubrics?: boolean;
  onRubricsToggle?: () => void;
  messages?: Message[];
}

const TopBar: React.FC<TopBarProps> = ({ 
  onSettingsClick
}) => {
  const navigate = useNavigate();

  const handleAdminClick = () => {
    navigate('/admin');
  };

  return (
    <div className="border-b border-zinc-200 bg-white/80 backdrop-blur-sm">
      <div className="max-w-4xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Brain className="h-6 w-6 text-blue-600" />
              <h1 className="text-xl font-bold text-gray-800">EvAI</h1>
            </div>
            <div className="hidden sm:block text-sm text-gray-500">
              Empathische AI Assistent
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleAdminClick}
              className="text-gray-600 hover:text-gray-800"
            >
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline ml-2">Admin</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onSettingsClick}
              className="text-gray-600 hover:text-gray-800"
            >
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline ml-2">Instellingen</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopBar;
