
import React from 'react';
import { Database, BarChart, Monitor, Brain, BookOpen } from 'lucide-react';
import { TabsList, TabsTrigger } from '@/components/ui/tabs';

interface AdminTabsListProps {
  hasRubricActivity: boolean;
}

const AdminTabsList: React.FC<AdminTabsListProps> = ({ hasRubricActivity }) => {
  return (
    <TabsList className="grid w-full grid-cols-2 sm:grid-cols-5 bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 p-1 sm:p-1.5 gap-0.5 sm:gap-1">
      <TabsTrigger 
        value="handleiding" 
        className="flex items-center justify-center gap-1 sm:gap-2 rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-500 data-[state=active]:text-white transition-all duration-200 text-xs sm:text-sm px-1.5 sm:px-3 py-2 sm:py-2.5"
      >
        <BookOpen size={14} className="flex-shrink-0" />
        <span className="hidden xs:inline sm:inline truncate">Handleiding</span>
      </TabsTrigger>

      <TabsTrigger 
        value="analyse" 
        className="flex items-center justify-center gap-1 sm:gap-2 rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-blue-500 data-[state=active]:text-white transition-all duration-200 text-xs sm:text-sm px-1.5 sm:px-3 py-2 sm:py-2.5"
      >
        <Brain size={14} className="flex-shrink-0" />
        <span className="hidden xs:inline sm:inline truncate">Analyse</span>
      </TabsTrigger>
      
      <TabsTrigger 
        value="kennisbank" 
        className="flex items-center justify-center gap-1 sm:gap-2 rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-500 data-[state=active]:text-white transition-all duration-200 text-xs sm:text-sm px-1.5 sm:px-3 py-2 sm:py-2.5"
      >
        <Database size={14} className="flex-shrink-0" />
        <span className="hidden xs:inline sm:inline truncate">Kennisbank</span>
      </TabsTrigger>
      
      <TabsTrigger 
        value="data" 
        className="flex items-center justify-center gap-1 sm:gap-2 rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-500 data-[state=active]:text-white transition-all duration-200 text-xs sm:text-sm px-1.5 sm:px-3 py-2 sm:py-2.5"
      >
        <BarChart size={14} className="flex-shrink-0" />
        <span className="hidden xs:inline sm:inline truncate">Data</span>
      </TabsTrigger>
      
      <TabsTrigger 
        value="systeem" 
        className="flex items-center justify-center gap-1 sm:gap-2 rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-500 data-[state=active]:text-white transition-all duration-200 text-xs sm:text-sm px-1.5 sm:px-3 py-2 sm:py-2.5"
      >
        <Monitor size={14} className="flex-shrink-0" />
        <span className="hidden xs:inline sm:inline truncate">Systeem</span>
      </TabsTrigger>
    </TabsList>
  );
};

export default AdminTabsList;
