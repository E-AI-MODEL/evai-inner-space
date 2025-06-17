
import React from 'react';
import { ArrowLeft, Brain, Sparkles, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import SupabaseConnectionStatus from './SupabaseConnectionStatus';

interface AdminHeaderProps {
  onBackClick: () => void;
  messageCount: number;
  isMobile: boolean;
}

const AdminHeader: React.FC<AdminHeaderProps> = ({ onBackClick, messageCount, isMobile }) => {
  return (
    <div className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 via-blue-600/10 to-indigo-600/10" />
      <div className="absolute inset-0 opacity-30" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
      }} />
      
      <div className="relative container mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <div className="space-y-3 sm:space-y-4">
          {/* Top Row - Back Button and Title */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Button
              variant="ghost"
              size={isMobile ? "sm" : "default"}
              onClick={onBackClick}
              aria-label="Terug naar chat"
              className="flex items-center gap-1.5 sm:gap-2 hover:bg-white/60 backdrop-blur-sm border border-white/20 flex-shrink-0 bg-white/50 px-2 sm:px-3 py-1.5 sm:py-2"
            >
              <ArrowLeft size={isMobile ? 16 : 18} />
              <span className="text-sm sm:text-base">Terug</span>
            </Button>
            
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <div className="p-1.5 sm:p-2 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex-shrink-0">
                <Brain className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-purple-700 via-blue-700 to-indigo-700 bg-clip-text text-transparent truncate">
                  EvAI Admin
                </h1>
                <Badge variant="secondary" className="bg-purple-100 text-purple-800 border-purple-200 text-xs mt-1">
                  v5.6 Pro
                </Badge>
              </div>
            </div>
          </div>

          {/* Mobile Stats Row */}
          <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1">
            <div className="flex items-center gap-3 text-xs text-gray-600 flex-shrink-0">
              <div className="flex items-center gap-1">
                <Sparkles size={12} className="text-yellow-500 flex-shrink-0" />
                <span className="whitespace-nowrap">AI Engine</span>
              </div>
              <div className="flex items-center gap-1">
                <Activity size={12} className="text-blue-500 flex-shrink-0" />
                <span className="whitespace-nowrap">{messageCount} Berichten</span>
              </div>
            </div>
            
            <div className="flex-shrink-0">
              <SupabaseConnectionStatus />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminHeader;
