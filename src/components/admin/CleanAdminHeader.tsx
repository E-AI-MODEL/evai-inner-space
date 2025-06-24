
import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Settings, Users, BarChart3, Brain } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface CleanAdminHeaderProps {
  onBackClick: () => void;
  messageCount: number;
  isMobile: boolean;
}

const CleanAdminHeader: React.FC<CleanAdminHeaderProps> = ({
  onBackClick,
  messageCount,
  isMobile
}) => {
  return (
    <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left section */}
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBackClick}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              {!isMobile && "Terug naar Chat"}
            </Button>
            
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Brain className="h-6 w-6 text-blue-600" />
                <h1 className="text-xl font-bold text-gray-900">
                  {isMobile ? "EvAI Admin" : "EvAI Admin Dashboard"}
                </h1>
              </div>
              
              <Badge variant="secondary" className="hidden sm:inline-flex">
                Live
              </Badge>
            </div>
          </div>

          {/* Right section */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <BarChart3 className="h-4 w-4" />
                <span className="hidden sm:inline">{messageCount} berichten</span>
                <span className="sm:hidden">{messageCount}</span>
              </div>
              
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Actief</span>
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              </div>
            </div>
            
            <Button variant="outline" size="sm" className="hidden sm:flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Instellingen
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CleanAdminHeader;
