
import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Brain, Settings } from "lucide-react";

interface TopBarProps {
  onSettingsClick: () => void;
}

const TopBar: React.FC<TopBarProps> = ({ onSettingsClick }) => {
  const navigate = useNavigate();

  const handleLogoClick = () => {
    navigate('/admin');
  };

  return (
    <header className="border-b border-zinc-200 bg-white/80 backdrop-blur-sm">
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
        <div
          className="flex items-center gap-2 cursor-pointer"
          onClick={handleLogoClick}
          title="Klik om naar Admin Dashboard te gaan"
        >
          <Brain className="h-6 w-6 text-blue-600" />
          <h1 className="text-xl font-bold text-gray-800">EvAI Neurosymbolische Chat</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onSettingsClick} className="text-gray-600 hover:text-gray-800">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
};

export default TopBar;
